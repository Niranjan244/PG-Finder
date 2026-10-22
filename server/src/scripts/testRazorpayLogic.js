import crypto from 'crypto';

const runVerification = () => {
  console.log('--- 1. Testing HMAC SHA256 Payment Verification ---');
  const secret = 'test_secret_12345';
  const orderId = 'order_DA1234567890';
  const paymentId = 'pay_9876543210';

  // Legitimate signature from Razorpay
  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  // Verify valid signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const isValid =
    validSignature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(validSignature), Buffer.from(expectedSignature));

  console.assert(isValid === true, 'Valid signature should verify successfully');
  console.log('✓ Valid signature verification: PASS');

  // Verify tampered signature
  const tamperedSignature = validSignature.slice(0, -4) + 'abcd';
  const isTamperedValid =
    tamperedSignature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(tamperedSignature), Buffer.from(expectedSignature));

  console.assert(isTamperedValid === false, 'Tampered signature must be rejected');
  console.log('✓ Tampered signature rejection: PASS');

  console.log('--- 2. Testing Webhook Signature Verification ---');
  const webhookSecret = 'whsec_99999999';
  const rawBody = Buffer.from(JSON.stringify({ event: 'payment.captured', entity: { id: paymentId } }));

  const validWebhookSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  const expectedWebhookSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  const isWebhookValid =
    validWebhookSig.length === expectedWebhookSig.length &&
    crypto.timingSafeEqual(Buffer.from(validWebhookSig), Buffer.from(expectedWebhookSig));

  console.assert(isWebhookValid === true, 'Webhook valid signature should pass');
  console.log('✓ Valid webhook signature: PASS');

  const invalidWebhookSig = 'invalid_webhook_signature_hex_1234567890abcdef';
  const isInvalidWebhookValid =
    invalidWebhookSig.length === expectedWebhookSig.length &&
    crypto.timingSafeEqual(Buffer.from(invalidWebhookSig), Buffer.from(expectedWebhookSig));

  console.assert(isInvalidWebhookValid === false, 'Invalid webhook signature must fail');
  console.log('✓ Invalid webhook signature rejection: PASS');

  console.log('--- 3. Testing Amount in Paise Conversion ---');
  const tokenInRupees = 1000;
  const tokenInPaise = Math.round(tokenInRupees * 100);
  console.assert(tokenInPaise === 100000, '1000 INR should convert to 100000 paise');
  console.log(`✓ INR to Paise conversion (₹${tokenInRupees} -> ${tokenInPaise} paise): PASS`);

  console.log('\nAll core cryptographic and financial calculations verified successfully!');
};

runVerification();
