const {onRequest} = require('firebase-functions/v2/https');
const {defineSecret} = require('firebase-functions/params');
const admin = require('firebase-admin');
const crypto = require('crypto');
const {Resend} = require('resend');

admin.initializeApp();
const db = admin.firestore();
const RESEND_API_KEY = defineSecret('RESEND_API_KEY');
const OTP_FROM = defineSecret('OTP_FROM');
const TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function cors(req,res){
  const origin = '*';
  res.set('Access-Control-Allow-Origin', origin);
  res.set('Vary','Origin');
  res.set('Access-Control-Allow-Headers','Content-Type, Authorization');
  res.set('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  if(req.method==='OPTIONS'){res.status(204).send('');return true}
  return false;
}
function normalizeEmail(v){return String(v||'').trim().toLowerCase()}
function hash(code){return crypto.createHash('sha256').update(code).digest('hex')}
function randomCode(){return String(crypto.randomInt(0,1000000)).padStart(6,'0')}
function id(email){return crypto.createHash('sha256').update(email).digest('hex')}

exports.sendOtp = onRequest({region:'asia-south1',secrets:[RESEND_API_KEY,OTP_FROM],timeoutSeconds:30}, async (req,res)=>{
  if(cors(req,res)) return;
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const email=normalizeEmail(req.body?.email), name=String(req.body?.name||'').trim().slice(0,100);
    if(!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({error:'Invalid email address'});
    const ref=db.collection('otpChallenges').doc(id(email));
    const snap=await ref.get(); const old=snap.exists?snap.data():null;
    if(old?.lastSentAt?.toMillis && Date.now()-old.lastSentAt.toMillis()<60*1000) return res.status(429).json({error:'Please wait 60 seconds before requesting another OTP.'});
    const code=randomCode();
    await ref.set({email,name,codeHash:hash(code),expiresAt:admin.firestore.Timestamp.fromMillis(Date.now()+TTL_MS),attempts:0,lastSentAt:admin.firestore.FieldValue.serverTimestamp()});
    const resend=new Resend(RESEND_API_KEY.value());
    const from=OTP_FROM.value();
    await resend.emails.send({from,to:email,subject:'WOWSHOPPING Email Verification Code',html:`<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>WOWSHOPPING</h2><p>Your verification code is:</p><div style="font-size:34px;font-weight:800;letter-spacing:8px;padding:18px 0">${code}</div><p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p></div>`});
    res.json({ok:true,expiresIn:600});
  }catch(e){console.error(e);res.status(500).json({error:'Unable to send OTP email'});}
});

exports.verifyOtp = onRequest({region:'asia-south1',timeoutSeconds:30}, async (req,res)=>{
  if(cors(req,res)) return;
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const email=normalizeEmail(req.body?.email), code=String(req.body?.code||'').trim();
    if(!/^\S+@\S+\.\S+$/.test(email)||!/^[0-9]{6}$/.test(code)) return res.status(400).json({error:'Invalid OTP'});
    const ref=db.collection('otpChallenges').doc(id(email)); const snap=await ref.get();
    if(!snap.exists) return res.status(400).json({error:'OTP not found. Request a new code.'});
    const d=snap.data();
    if(d.expiresAt.toMillis()<Date.now()) {await ref.delete();return res.status(400).json({error:'OTP expired. Request a new code.'});}
    if(Number(d.attempts||0)>=MAX_ATTEMPTS) {await ref.delete();return res.status(429).json({error:'Too many invalid attempts. Request a new code.'});}
    if(hash(code)!==d.codeHash){await ref.update({attempts:admin.firestore.FieldValue.increment(1)});return res.status(400).json({error:'Incorrect OTP'});}
    let user;
    try{user=await admin.auth().getUserByEmail(email)}catch(e){if(e.code!=='auth/user-not-found')throw e;user=await admin.auth().createUser({email,emailVerified:true,displayName:d.name||email.split('@')[0]})}
    if(d.name && (!user.displayName || user.displayName===email.split('@')[0])) await admin.auth().updateUser(user.uid,{displayName:d.name,emailVerified:true});
    await db.collection('users').doc(user.uid).set({uid:user.uid,name:(d.name||user.displayName||email.split('@')[0]),email,role:'customer',emailVerified:true,lastLoginAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});
    const token=await admin.auth().createCustomToken(user.uid,{provider:'email_otp'});
    await ref.delete(); res.json({ok:true,customToken:token});
  }catch(e){console.error(e);res.status(500).json({error:'Unable to verify OTP'});}
});

exports.listUsers = onRequest({region:'asia-south1',timeoutSeconds:30}, async (req,res)=>{
  if(cors(req,res)) return;
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  try{
    const authHeader=String(req.headers.authorization||'');
    if(!authHeader.startsWith('Bearer ')) return res.status(401).json({error:'Authentication required'});
    const decoded=await admin.auth().verifyIdToken(authHeader.slice(7), true);
    if(decoded.admin!==true) return res.status(403).json({error:'Admin access required'});
    const users=[]; let pageToken;
    do{
      const page=await admin.auth().listUsers(1000,pageToken);
      for (const u of page.users) {
        const profileSnap = await db.collection('users').doc(u.uid).get();
        const profile = profileSnap.exists ? profileSnap.data() : {};
        users.push({
          uid:u.uid,email:u.email||'',displayName:u.displayName||profile.name||'',photoURL:u.photoURL||profile.photoURL||'',
          phoneNumber:u.phoneNumber||profile.phone||profile.phoneNumber||'',phoneVerified:profile.phoneVerified===true,
          emailVerified:!!u.emailVerified,disabled:!!u.disabled,providerData:(u.providerData||[]).map(p=>p.providerId),
          createdAt:u.metadata?.creationTime||'',lastSignInAt:u.metadata?.lastSignInTime||'',admin:u.customClaims?.admin===true,
          disabled:!!u.disabled,
          name:profile.name||u.displayName||'',address:profile.address||profile.addressLine1||'',addressLine2:profile.addressLine2||'',
          city:profile.city||'',district:profile.district||'',province:profile.province||'',postalCode:profile.postalCode||profile.postal||'',
          country:profile.country||'Sri Lanka',email:profile.email||u.email||'',photoURL:profile.photoURL||u.photoURL||'',
          loginProvider:profile.loginProvider||'',role:profile.role||'customer',online:profile.online===true && profile.lastActiveAt?.toMillis ? (Date.now()-profile.lastActiveAt.toMillis()<120000) : false,
          lastActiveAt:profile.lastActiveAt?.toDate?.()?.toISOString?.()||'',updatedAt:profile.updatedAt?.toDate?.()?.toISOString?.()||'',createdProfileAt:profile.createdAt?.toDate?.()?.toISOString?.()||''
        });
      }
      pageToken=page.pageToken;
    }while(pageToken);
    res.json({ok:true,users});
  }catch(e){console.error(e);res.status(401).json({error:'Admin authentication failed'});}
});



exports.savePayHereCredentials = onRequest({region:'asia-south1',timeoutSeconds:30}, async (req,res)=>{
  if(cors(req,res)) return;
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const authHeader=String(req.headers.authorization||'');
    if(!authHeader.startsWith('Bearer ')) return res.status(401).json({error:'Authentication required'});
    const decoded=await admin.auth().verifyIdToken(authHeader.slice(7), true);
    if(decoded.admin!==true) return res.status(403).json({error:'Admin access required'});
    const b=req.body||{};
    const merchantId=String(b.merchantId||'').trim();
    const merchantSecret=String(b.merchantSecret||'').trim();
    const mode=String(b.mode||'live').toLowerCase()==='sandbox'?'sandbox':'live';
    const returnUrl=String(b.returnUrl||'').trim();
    if(!merchantId) return res.status(400).json({error:'Merchant ID is required'});
    if(!merchantSecret) return res.status(400).json({error:'Merchant Secret is required'});
    await db.collection('siteConfig').doc('paymentSettings').set({
      enabled:{payhere:b.enabled!==false,bank:b.bankEnabled!==false,cod:b.codEnabled!==false},
      payhere:{merchantId,mode,returnUrl},
      updatedAt:admin.firestore.FieldValue.serverTimestamp(),
      updatedBy:decoded.uid
    },{merge:true});
    await db.collection('paymentSecrets').doc('payhere').set({merchantSecret,updatedAt:admin.firestore.FieldValue.serverTimestamp(),updatedBy:decoded.uid});
    res.json({ok:true,merchantId,mode,hasSecret:true});
  }catch(e){console.error(e);res.status(401).json({error:'Unable to save PayHere credentials'});}
});

exports.getPayHereCredentialStatus = onRequest({region:'asia-south1',timeoutSeconds:30}, async (req,res)=>{
  if(cors(req,res)) return;
  if(req.method!=='GET') return res.status(405).json({error:'Method not allowed'});
  try{
    const authHeader=String(req.headers.authorization||'');
    if(!authHeader.startsWith('Bearer ')) return res.status(401).json({error:'Authentication required'});
    const decoded=await admin.auth().verifyIdToken(authHeader.slice(7), true);
    if(decoded.admin!==true) return res.status(403).json({error:'Admin access required'});
    const [cfgSnap,secretSnap]=await Promise.all([db.collection('siteConfig').doc('paymentSettings').get(),db.collection('paymentSecrets').doc('payhere').get()]);
    const cfg=cfgSnap.exists?cfgSnap.data():{}; const ph=cfg.payhere||{}; const sec=secretSnap.exists?secretSnap.data():{};
    res.json({ok:true,merchantId:String(ph.merchantId||''),mode:String(ph.mode||'live'),returnUrl:String(ph.returnUrl||''),hasSecret:!!String(sec.merchantSecret||'')});
  }catch(e){console.error(e);res.status(401).json({error:'Unable to read PayHere settings'});}
});

exports.createPayHereCheckout = onRequest({region:'asia-south1',timeoutSeconds:30}, async (req,res)=>{
  if(cors(req,res)) return;
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  try{
    const b=req.body||{}, orderId=String(b.orderId||'').trim(), amount=Number(b.amount||0);
    if(!orderId||!Number.isFinite(amount)||amount<=0) return res.status(400).json({error:'Invalid order'});
    const snap=await db.collection('siteConfig').doc('paymentSettings').get();
    const cfg=snap.exists?snap.data():{}; const ph=cfg.payhere||{};
    if(cfg.enabled?.payhere===false) return res.status(403).json({error:'PayHere payments are disabled'});
    const merchantId=String(ph.merchantId||'').trim();
    const secSnap=await db.collection('paymentSecrets').doc('payhere').get();
    const merchantSecret=secSnap.exists?String(secSnap.data().merchantSecret||'').trim():'';
    if(!merchantId||!merchantSecret) return res.status(503).json({error:'PayHere Merchant ID and Merchant Secret are not configured in Admin Panel'});
    const customer=b.customer||{}, shipping=b.shipping||{};
    const baseUrl=String(ph.returnUrl||'').trim() || 'https://wowshopping-cd8bd.web.app/';
    const returnUrl=baseUrl;
    const cancelUrl=baseUrl;
    const notifyUrl='https://asia-south1-wowshopping-cd8bd.cloudfunctions.net/payhereNotify';
    const currency=String(b.currency||'LKR').toUpperCase(); const formatted=amount.toFixed(2);
    const secretHash=crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    const hash=crypto.createHash('md5').update(merchantId+orderId+formatted+currency+secretHash).digest('hex').toUpperCase();
    const fullName=String(customer.name||'Customer').trim().split(/\s+/); const firstName=fullName.shift()||'Customer'; const lastName=fullName.join(' ')||'Customer';
    const phone=String(shipping.phone||shipping.phoneNumber||customer.phone||'').trim();
    const address=String(shipping.address||shipping.addressLine||customer.address||'').trim();
    const city=String(shipping.city||customer.city||'').trim();
    if(!phone||!address||!city) return res.status(400).json({error:'Customer phone, address and city are required for PayHere payment'});
    const params={merchant_id:merchantId,return_url:returnUrl,cancel_url:cancelUrl,notify_url:notifyUrl,first_name:firstName,last_name:lastName,email:String(customer.email||''),phone,address,city,country:'Sri Lanka',order_id:orderId,items:String(b.items||'WOWSHOPPING Order'),currency,amount:formatted,hash};
    await db.collection('orders').doc(orderId).set({paymentStatus:'initiated',paymentProvider:'payhere',payhereMode:String(ph.mode||'live'),updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});
    res.json({ok:true,action:(String(ph.mode||'live')==='sandbox'?'https://sandbox.payhere.lk/pay/checkout':'https://www.payhere.lk/pay/checkout'),params});
  }catch(e){console.error(e);res.status(500).json({error:'Unable to create PayHere checkout'});}
});

exports.payhereNotify = onRequest({region:'asia-south1',timeoutSeconds:30}, async (req,res)=>{
  if(req.method!=='POST') return res.status(405).send('Method not allowed');
  try{
    const p=req.body||{}; const merchantId=String(p.merchant_id||'').trim(); const orderId=String(p.order_id||'').trim(); const amount=String(p.payhere_amount||''); const currency=String(p.payhere_currency||''); const status=Number(p.status_code||0); const sig=String(p.md5sig||'').toUpperCase();
    const [cfgSnap,secSnap,orderSnap]=await Promise.all([db.collection('siteConfig').doc('paymentSettings').get(),db.collection('paymentSecrets').doc('payhere').get(),db.collection('orders').doc(orderId).get()]);
    const cfg=cfgSnap.exists?cfgSnap.data():{}; const ph=cfg.payhere||{}; const merchantSecret=secSnap.exists?String(secSnap.data().merchantSecret||'').trim():'';
    if(!merchantSecret||merchantId!==String(ph.merchantId||'').trim()) return res.status(400).send('Invalid merchant');
    if(!orderSnap.exists) return res.status(404).send('Order not found');
    const order=orderSnap.data(); const expectedAmount=Number(order.total||0).toFixed(2);
    if(expectedAmount!==Number(amount).toFixed(2) || String(order.paymentMethod||'')!=='payhere' || currency!=='LKR') return res.status(400).send('Invalid order data');
    const secretHash=crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
    const expected=crypto.createHash('md5').update(merchantId+orderId+amount+currency+status+secretHash).digest('hex').toUpperCase();
    if(!sig||sig!==expected) return res.status(400).send('Invalid signature');
    const paymentStatus=status===2?'paid':status===0?'pending':'failed';
    await db.collection('orders').doc(orderId).set({paymentStatus,paymentProvider:'payhere',payhereStatusCode:status,payhereStatusMessage:String(p.status_message||''),payherePaymentId:String(p.payment_id||''),payhereMethod:String(p.method||''),payhereCardLast4:String(p.card_no||'').slice(-4),updatedAt:admin.firestore.FieldValue.serverTimestamp()},{merge:true});
    res.status(200).send('OK');
  }catch(e){console.error(e);res.status(500).send('ERROR');}
});
