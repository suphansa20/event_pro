// src/pages/BookingSummary.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
 
/**
* รองรับแหล่งข้อมูลได้หลายทาง:
* - props:        { eventName, ticketType, quantity, totalPrice }
* - location.state: { eventName, ticketType, quantity, totalPrice, ticketId }
* - querystring:  ?event=..&type=..&qty=..&total=..
* - route param:  /booking/:ticketId  -> ดึงจาก Supabase (tickets + events)
*/
export default function BookingSummary(props) {
  const { ticketId: ticketIdFromParam } = useParams();
  const location = useLocation();
  const [search] = useSearchParams();
 
  const state = location?.state || {};
 
  // states
  const [paymentMethod, setPaymentMethod] = useState("PromptPay");
  const [loading, setLoading] = useState(!!ticketIdFromParam); // ถ้ามี ticketId ต้องโหลดจาก DB
  const [err, setErr] = useState("");
 
  // data ที่จะนำมาแสดง (เริ่มจาก props → state → querystring)
  const [resolved, setResolved] = useState({
    ticketId: state.ticketId || null,
    eventName:
      props.eventName ||
      state.eventName ||
      search.get("event") ||
      "",
    ticketType:
      props.ticketType ||
      state.ticketType ||
      search.get("type") ||
      "",
    quantity: Number(
      props.quantity ?? state.quantity ?? search.get("qty") ?? 0
    ),
    totalPrice: Number(
      props.totalPrice ?? state.totalPrice ?? search.get("total") ?? 0
    ),
    paymentStatus: state.paymentStatus || "PENDING",
  });
 
  // ถ้ามีพารามิเตอร์ ticketId ให้ไปดึงจาก Supabase
  useEffect(() => {
    if (!ticketIdFromParam) return;
    (async () => {
      setLoading(true);
      setErr("");
      // 1) tickets
      const { data: ticket, error: tErr } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", ticketIdFromParam)
        .single();
 
      if (tErr || !ticket) {
        setErr("ไม่พบข้อมูลการจอง");
        setLoading(false);
        return;
      }
 
      // 2) events (ดึงชื่ออีเวนต์)
      let eventName = "";
      if (ticket.event_id) {
        const { data: ev, error: eErr } = await supabase
          .from("events")
          .select("name")
          .eq("id", ticket.event_id)
          .single();
        if (!eErr && ev) eventName = ev.name;
      }
 
      setResolved({
        ticketId: ticket.id,
        eventName: eventName || state.eventName || "",
        ticketType: ticket.ticket_type,
        quantity: Number(ticket.quantity || 0),
        totalPrice: Number(ticket.total_price || 0),
        paymentStatus: ticket.payment_status || "PENDING",
      });
 
      // ตั้งช่องทางชำระเงินจากตั๋ว หากมี
      if (ticket.payment_method) setPaymentMethod(ticket.payment_method);
 
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketIdFromParam]);
 
  const prettyTotal = useMemo(
    () => (resolved.totalPrice || 0).toLocaleString(),
    [resolved.totalPrice]
  );
 
  async function handleConfirm() {
    // แสดงผลทันที
    alert(
      `คุณได้ยืนยันการชำระเงิน\nEvent: ${resolved.eventName}\nType: ${resolved.ticketType}\nQuantity: ${resolved.quantity}\nTotal: ${resolved.totalPrice} บาท\nPayment: ${paymentMethod}`
    );
 
    // ถ้ามี ticketId (มาจาก DB) -> อัปเดตสถานะเป็น PAID
    if (resolved.ticketId || ticketIdFromParam) {
      const idToUpdate = resolved.ticketId || ticketIdFromParam;
      const { error } = await supabase
        .from("tickets")
        .update({
          payment_method: paymentMethod,
          payment_status: "PAID",
        })
        .eq("id", idToUpdate);
 
      if (error) {
        console.error(error);
        setErr("อัปเดตสถานะการชำระเงินไม่สำเร็จ");
      } else {
        setResolved((prev) => ({ ...prev, paymentStatus: "PAID" }));
      }
    }
  }
 
  if (loading) return <div className="container"><p>Loading...</p></div>;
 
  return (
<div className="container" style={{ maxWidth: 720, margin: "0 auto" }}>
<h2>🧾 สรุปรายการจอง</h2>
<hr />
 
      {err && <p style={{ color: "crimson" }}>{err}</p>}
 
      <h3 style={{ marginTop: 12 }}>{resolved.eventName || "ไม่ระบุอีเวนต์"}</h3>
<p>
        บัตร {resolved.ticketType || "-"} x {resolved.quantity || 0} →{" "}
        {prettyTotal} บาท
</p>
<p style={{ opacity: 0.8 }}>
        สถานะการชำระเงิน: <b>{resolved.paymentStatus}</b>
</p>
 
      <h4 style={{ marginTop: 16 }}>ช่องทางการชำระเงิน:</h4>
<label style={{ display: "block", marginBottom: 6 }}>
<input
          type="radio"
          name="payment"
          value="PromptPay"
          checked={paymentMethod === "PromptPay"}
          onChange={(e) => setPaymentMethod(e.target.value)}
        />{" "}
        QR PromptPay
</label>
<label style={{ display: "block", marginBottom: 6 }}>
<input
          type="radio"
          name="payment"
          value="CreditCard"
          checked={paymentMethod === "CreditCard"}
          onChange={(e) => setPaymentMethod(e.target.value)}
        />{" "}
        บัตรเครดิต
</label>
<label style={{ display: "block", marginBottom: 6 }}>
<input
          type="radio"
          name="payment"
          value="Wallet"
          checked={paymentMethod === "Wallet"}
          onChange={(e) => setPaymentMethod(e.target.value)}
        />{" "}
        Wallet
</label>
 
      <div style={{ margin: "16px 0" }}>
<button className="btn" onClick={handleConfirm}>
          ยืนยันการชำระเงิน
</button>
</div>
 
      <Link to="/">กลับไปหน้ารายการอีเวนต์</Link>
</div>
  );
}