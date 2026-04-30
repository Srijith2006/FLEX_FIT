import { useState } from "react";
import api from "../../services/api.js";
import useAuth from "../../hooks/useAuth.js";

// Dynamically load Razorpay script
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayCheckout({ program, onSuccess, onClose }) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const handlePay = async () => {
    setError(""); setLoading(true);

    // 1. Load Razorpay SDK
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      setError("Failed to load payment gateway. Check your internet connection.");
      setLoading(false);
      return;
    }

    try {
      // 2. Create order on backend
      const { data } = await api.post(
        "/payments/order",
        { programId: program._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, amount, currency, paymentId, keyId, programName, trainerName } = data;

      // 3. Open Razorpay checkout
      const options = {
        key:         keyId,
        amount:      amount,       // in paise
        currency:    currency,
        name:        "FlexFit",
        description: `${programName} — by ${trainerName}`,
        order_id:    orderId,
        prefill: {
          name:  user?.name  || "",
          email: user?.email || "",
        },
        theme: { color: "#0070f3" },

        handler: async (response) => {
          // 4. Verify on backend
          try {
            const verifyRes = await api.post(
              "/payments/verify",
              {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                paymentId,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyRes.data.success) {
              onSuccess?.({
                paymentId:   response.razorpay_payment_id,
                enrollment:  verifyRes.data.enrollment,
              });
            } else {
              setError("Payment verification failed. Contact support.");
            }
          } catch (e) {
            setError(e?.response?.data?.message || "Payment verification failed.");
          }
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
            onClose?.();
          },
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", (response) => {
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });

      rzp.open();
      setLoading(false);

    } catch (e) {
      setError(e?.response?.data?.message || "Could not initiate payment.");
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "12px" }}>
          ⚠ {error}
        </div>
      )}
      <button
        className="btn btn-accent btn-full"
        onClick={handlePay}
        disabled={loading}
      >
        {loading
          ? <><span className="spinner" style={{ borderTopColor: "#fff" }}></span> Opening Payment…</>
          : `Pay ₹${program.price} & Enroll`}
      </button>
      <div style={{ textAlign: "center", marginTop: "8px", fontSize: "11px", color: "var(--text3)" }}>
        🔒 Secured by Razorpay · UPI, Cards, Net Banking accepted
      </div>
    </div>
  );
}