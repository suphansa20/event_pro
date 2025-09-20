// src/pages/EventDetail.jsx
import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
 
export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [ticketType, setTicketType] = useState("VIP");
  const [quantity, setQuantity] = useState(1);
  const [booking, setBooking] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("PromptPay");
  const [ticketRecord, setTicketRecord] = useState(null);
 
  useEffect(() => {
    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
 
  async function fetchEvent() {
    setLoading(true);
    setErr("");
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();
 
    if (error) {
      console.error(error);
      setErr("ไม่พบอีเวนต์หรือโหลดข้อมูลล้มเหลว");
    } else {
      setEvent(data || null);
    }
    setLoading(false);
  }
 
  // สร้างตารางราคาให้รองรับทั้งเลขเดียว และ JSON
  const priceTable = useMemo(() => {
    if (!event) return {};
    // ถ้า event.price เป็น object/JSONB
    if (event.price && typeof event.price === "object") return event.price;
    // ถ้ามีฟิลด์สำรองชื่อ ticket_prices
    if (event.ticket_prices && typeof event.ticket_prices === "object")
      return event.ticket_prices;
    // ถ้าเป็นเลขเดียว ให้ผูกกับประเภท "STANDARD"
    if (typeof event?.price === "number")
      return { STANDARD: event.price };
    // เผื่อมีเป็น string JSON
    try {
      if (typeof event?.price === "string") {
        const parsed = JSON.parse(event.price);
        if (parsed && typeof parsed === "object") return parsed;
      }
    } catch (_) {}
    return {};
  }, [event]);
 
  // list ประเภทบัตร
  const ticketTypes = useMemo(() => Object.keys(priceTable), [priceTable]);
 
  // ตั้งค่าเริ่มต้นให้ ticketType ถ้าไม่มีในตาราง
  useEffect(() => {
    if (ticketTypes.length > 0 && !ticketTypes.includes(ticketType)) {
      setTicketType(ticketTypes[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketTypes.join("|")]);
 
  const unitPrice = priceTable?.[ticketType] || 0;
  const totalPrice = Math.max(0, unitPrice * (quantity || 0));
 
  async function bookTickets() {
    if (!event) return;
    if (!ticketType || !priceTable[ticketType]) {
      setErr("กรุณาเลือกประเภทบัตรให้ถูกต้อง");
      return;
    }
    if (!quantity || quantity < 1) {
      setErr("จำนวนบัตรต้องมากกว่า 0");
      return;
    }
 
    setErr("");
    setBooking(true);
 
    // บันทึกลง tickets
    const payload = {
      event_id: event.id,
      ticket_type: ticketType,
      quantity,
      total_price: totalPrice,
      payment_method: paymentMethod,
    };
 
    const { data: inserted, error: insertErr } = await supabase
      .from("tickets")
      .insert([payload])
      .select()
      .single();
 
    if (insertErr) {
      console.error(insertErr);
      setErr("จองบัตรไม่สำเร็จ");
      setBooking(false);
      return;
    }
 
    setTicketRecord(inserted);
 
    // อัปเดตยอด sold (ถ้ามีคอลัมน์นี้)
    try {
      await supabase
        .from("events")
        .update({ sold: (event.sold || 0) + quantity })
        .eq("id", event.id);
    } catch (e) {
      // ไม่ต้อง throw ต่อ — แค่บันทึกไม่ได้ก็ข้ามไป
      console.warn("update sold failed:", e?.message);
    }
 
    setShowSummary(true);
    setBooking(false);
  }
 
  if (loading) return <p>Loading...</p>;
  if (err && !event) return <p>{err}</p>;
  if (!event) return <p>Event not found</p>;
 
  return (
<div className="container" style={{ maxWidth: 720, margin: "0 auto" }}>
      {!showSummary ? (
<>
<h1 style={{ margin: "8px 0 4px" }}>{event.name}</h1>
<p style={{ margin: 0 }}>📍 {event.location}</p>
          {event.date && <p style={{ marginTop: 4 }}>📅 {event.date}</p>}
 
          <div style={{ display: "grid", gap: 12, margin: "16px 0" }}>
<label style={{ display: "grid", gap: 6 }}>
              ประเภทบัตร:
<select
                value={ticketType}
                onChange={(e) => setTicketType(e.target.value)}
                disabled={ticketTypes.length === 0}
                style={{ padding: 8, maxWidth: 260 }}
>
                {ticketTypes.length > 0 ? (
                  ticketTypes.map((type) => (
<option key={type} value={type}>
                      {type} ({priceTable[type]} ฿)
</option>
                  ))
                ) : (
<option>ไม่มีข้อมูลราคา</option>
                )}
</select>
</label>
 
            <label style={{ display: "grid", gap: 6 }}>
              จำนวน:
<input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, Number(e.target.value)))
                }
                style={{ padding: 8, maxWidth: 140 }}
              />
</label>
 
            <div>
<b>ราคารวม:</b> {totalPrice.toLocaleString()} ฿
</div>
 
            <div>
<h4 style={{ margin: "12px 0 6px" }}>ช่องทางการชำระเงิน:</h4>
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
<label style={{ display: "block" }}>
<input
                  type="radio"
                  name="payment"
                  value="Wallet"
                  checked={paymentMethod === "Wallet"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />{" "}
                Wallet
</label>
</div>
 
            {err && <p style={{ color: "crimson" }}>{err}</p>}
 
            <button
              onClick={bookTickets}
              disabled={booking || ticketTypes.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
>
              {booking ? "กำลังจอง..." : "จองบัตร"}
</button>
</div>
 
          <Link to="/">← กลับหน้ารายการอีเวนต์</Link>
</>
      ) : (
<>
<h2>🧾 สรุปรายการจอง</h2>
<p style={{ marginBottom: 4 }}>{event.name}</p>
<p style={{ margin: 0 }}>
            บัตร {ticketType} x {quantity} →{" "}
            {totalPrice.toLocaleString()} บาท
</p>
<p style={{ marginTop: 4 }}>ชำระผ่าน: {paymentMethod}</p>
          {ticketRecord?.id && (
<p style={{ opacity: 0.8 }}>รหัสสลิป/การจอง: #{ticketRecord.id}</p>
          )}
<div style={{ marginTop: 12 }}>
<Link to="/">กลับไปหน้ารายการอีเวนต์</Link>
</div>
</>
      )}
</div>
  );
}