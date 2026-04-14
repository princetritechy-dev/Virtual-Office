import Link from "next/link";
import "./orderSuccess.css";
export default function PaymentSuccessPage() {
  return (
    <main className="paymentSuccessPage">
      <div className="paymentSuccessWrap">
        <div className="paymentSuccessCard">
          <div className="successIconWrap">
            <div className="successIcon">✓</div>
          </div>

          <span className="successBadge">Payment Successful</span>

          <h1 className="successTitle">Thank you for your purchase</h1>

          <p className="successText">
            Your payment has been completed successfully and your subscription
            has been processed.
          </p>

          <div className="successInfoBox">
            <div className="infoRow">
              <span>Status</span>
              <strong>Confirmed</strong>
            </div>
            <div className="infoRow">
              <span>Access</span>
              <strong>Activated</strong>
            </div>
            <div className="infoRow">
              <span>Next Step</span>
              <strong>View your dashboard</strong>
            </div>
          </div>

          <div className="successActions">
            <Link href="/dashboard" className="primarySuccessBtn">
              Go to Dashboard
            </Link>

            <Link href="/order-history" className="secondarySuccessBtn">
              View Order History
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}