import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearOnUnauthorized,
  deleteAdminService,
  deleteApplication,
  deleteMessage,
  getAdminApplications,
  getAdminBookings,
  getAdminMessages,
  getAdminServices,
  markMessageRead,
  setOnUnauthorized,
  updateAdminService,
  updateApplicationStatus,
  updateBookingStatus,
  createAdminService,
  deleteBooking,
} from "../api/client";
import type { Booking, ContactMessage, IdolApplication, Service } from "../api/types";
import { MeetingMethodIcon } from "../components/MeetingMethod";

type Tab = "bookings" | "services" | "applications" | "messages";

function statusBtn(token: string, label: string, active?: boolean) {
  const colors: Record<string, string> = {
    confirm: "bg-arcane/20 text-arcane hover:bg-arcane/30",
    cancel: "bg-arcane/10 text-lilac hover:bg-arcane/20",
    delete: "bg-arcane/10 text-lilac/70 hover:bg-arcane/20 hover:text-lilac",
  };
  return `${colors[token] || colors.delete} px-2 py-1 rounded text-xs font-body font-semibold transition-all whitespace-nowrap`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("bookings");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [applications, setApplications] = useState<IdolApplication[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [appFilter, setAppFilter] = useState("");
  const [error, setError] = useState("");

  // Service form state
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [svcName, setSvcName] = useState("");
  const [svcDesc, setSvcDesc] = useState("");
  const [svcDuration, setSvcDuration] = useState(60);
  const [svcPrice, setSvcPrice] = useState(0);
  const [svcActive, setSvcActive] = useState(true);

  const loadBookings = useCallback(() => {
    getAdminBookings(statusFilter || undefined, dateFilter || undefined)
      .then(setBookings)
      .catch((e) => setError(e.message));
  }, [statusFilter, dateFilter]);

  const loadServices = useCallback(() => {
    getAdminServices()
      .then(setServices)
      .catch((e) => setError(e.message));
  }, []);

  const loadApplications = useCallback(() => {
    getAdminApplications(appFilter || undefined)
      .then(setApplications)
      .catch((e) => setError(e.message));
  }, [appFilter]);

  const loadMessages = useCallback(() => {
    getAdminMessages()
      .then(setMessages)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    setOnUnauthorized(() => navigate("/admin/login"));
    loadBookings();
    loadServices();
    loadApplications();
    loadMessages();
    return () => clearOnUnauthorized();
  }, [loadBookings, loadServices, loadApplications, loadMessages, navigate]);

  useEffect(() => {
    if (tab === "services") loadServices();
    if (tab === "applications") loadApplications();
    if (tab === "messages") loadMessages();
  }, [tab, loadServices, loadApplications, loadMessages]);

  async function handleStatus(id: number, status: string) {
    try {
      await updateBookingStatus(id, status);
      loadBookings();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleDeleteBooking(id: number) {
    if (!confirm("Xóa lịch hẹn này?")) return;
    try {
      await deleteBooking(id);
      loadBookings();
    } catch (e: any) {
      setError(e.message);
    }
  }

  function openNewService() {
    setEditService(null);
    setSvcName("");
    setSvcDesc("");
    setSvcDuration(60);
    setSvcPrice(0);
    setSvcActive(true);
    setShowServiceForm(true);
  }

  function openEditService(svc: Service) {
    setEditService(svc);
    setSvcName(svc.name);
    setSvcDesc(svc.description);
    setSvcDuration(svc.duration_minutes);
    setSvcPrice(svc.price);
    setSvcActive(svc.is_active);
    setShowServiceForm(true);
  }

  async function handleSaveService() {
    if (!svcName.trim()) {
      setError("Tên dịch vụ không được để trống");
      return;
    }
    if (!Number.isFinite(svcPrice) || svcPrice < 0) {
      setError("Giá phải là số >= 0");
      return;
    }
    if (!Number.isInteger(svcDuration) || svcDuration <= 0) {
      setError("Thời lượng phải là số nguyên > 0 (phút)");
      return;
    }
    try {
      const data = {
        name: svcName.trim(),
        description: svcDesc,
        duration_minutes: svcDuration,
        price: svcPrice,
        is_active: svcActive,
      };
      if (editService) {
        await updateAdminService(editService.id, data);
      } else {
        await createAdminService(data as any);
      }
      setShowServiceForm(false);
      loadServices();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleDeleteService(id: number) {
    if (!confirm("Xóa dịch vụ này?")) return;
    try {
      await deleteAdminService(id);
      loadServices();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleAppStatus(id: number, status: string) {
    try {
      await updateApplicationStatus(id, status);
      loadApplications();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleDeleteRegistration(id: number) {
    if (!confirm("Xóa đơn đăng ký này?")) return;
    try {
      await deleteApplication(id);
      loadApplications();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleMarkMessageRead(id: number) {
    try {
      await markMessageRead(id);
      loadMessages();
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleDeleteMessage(id: number) {
    if (!confirm("Xóa tin nhắn này?")) return;
    try {
      await deleteMessage(id);
      loadMessages();
    } catch (e: any) {
      setError(e.message);
    }
  }

  function getAppStatusBadge(status: string) {
    switch (status) {
      case "accepted":
        return "bg-arcane/20 text-arcane border-arcane/30";
      case "contacted":
        return "bg-candle-gold/20 text-candle-gold border-candle-gold/30";
      case "rejected":
        return "bg-arcane/10 text-lilac/50 border-arcane/20";
      default:
        return "bg-candle-gold/20 text-candle-gold border-candle-gold/30";
    }
  }

  function getAppStatusLabel(status: string) {
    switch (status) {
      case "accepted":
        return "Đã nhận";
      case "contacted":
        return "Đã liên hệ";
      case "rejected":
        return "Đã từ chối";
      default:
        return "Chờ xử lý";
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "confirmed":
        return "bg-arcane/20 text-arcane border-arcane/30";
      case "cancelled":
        return "bg-arcane/10 text-lilac/50 border-arcane/20";
      default:
        return "bg-candle-gold/20 text-candle-gold border-candle-gold/30";
    }
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-display text-2xl tracking-widest uppercase text-mist">
              Quản trị
            </h1>
            <p className="font-body text-lilac italic">Tarot Huyền Bí</p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("admin_token");
              navigate("/admin/login");
            }}
            className="px-4 py-2 rounded-lg font-body text-lilac border border-velvet hover:border-arcane/50 hover:text-arcane transition-all text-sm"
          >
            Đăng xuất
          </button>
        </div>

        {error && (
          <p className="font-body text-arcane text-sm text-center mb-4" role="alert">{error}</p>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-velvet">
          <button
            onClick={() => setTab("bookings")}
            className={`px-5 py-2.5 font-body text-sm tracking-wide uppercase transition-all ${
              tab === "bookings"
                ? "text-mist border-b-2 border-arcane"
                : "text-lilac/60 hover:text-lilac"
            }`}
          >
            Lịch hẹn
          </button>
          <button
            onClick={() => setTab("services")}
            className={`px-5 py-2.5 font-body text-sm tracking-wide uppercase transition-all ${
              tab === "services"
                ? "text-mist border-b-2 border-arcane"
                : "text-lilac/60 hover:text-lilac"
            }`}
          >
            Dịch vụ
          </button>
          <button
            onClick={() => setTab("applications")}
            className={`px-5 py-2.5 font-body text-sm tracking-wide uppercase transition-all ${
              tab === "applications"
                ? "text-mist border-b-2 border-arcane"
                : "text-lilac/60 hover:text-lilac"
            }`}
          >
            Đăng ký học
          </button>
          <button
            onClick={() => setTab("messages")}
            className={`px-5 py-2.5 font-body text-sm tracking-wide uppercase transition-all ${
              tab === "messages"
                ? "text-mist border-b-2 border-arcane"
                : "text-lilac/60 hover:text-lilac"
            }`}
          >
            Tin nhắn
            {messages.some((m) => !m.is_read) && (
              <span className="ml-1.5 inline-block min-w-5 px-1.5 py-0.5 rounded-full bg-candle-gold text-void text-xs font-body font-bold">
                {messages.filter((m) => !m.is_read).length}
              </span>
            )}
          </button>
        </div>

        {/* ──── Bookings tab ──── */}
        {tab === "bookings" && (
          <section>
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-velvet/60 border border-velvet rounded-lg px-3 py-1.5 font-body text-mist text-sm focus:outline-none focus:border-arcane"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="cancelled">Đã hủy</option>
              </select>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-velvet/60 border border-velvet rounded-lg px-3 py-1.5 font-body text-mist text-sm focus:outline-none focus:border-arcane"
              />
              <button
                onClick={loadBookings}
                className="px-3 py-1.5 rounded-lg font-body text-lilac border border-velvet hover:border-lilac/30 text-sm transition-all"
              >
                Lọc
              </button>
            </div>

            {/* Table — scrollable on mobile */}
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[640px] text-left">
                <thead>
                  <tr className="border-b border-velvet text-lilac/60 font-body text-sm tracking-wide uppercase">
                    <th scope="col" className="py-3 pr-2">Khách hàng</th>
                    <th scope="col" className="py-3 pr-2">SĐT</th>
                    <th scope="col" className="py-3 pr-2">Dịch vụ</th>
                    <th scope="col" className="py-3 pr-2">Hình thức</th>
                    <th scope="col" className="py-3 pr-2">Ngày</th>
                    <th scope="col" className="py-3 pr-2">Giờ</th>
                    <th scope="col" className="py-3 pr-2">Trạng thái</th>
                    <th scope="col" className="py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-b border-velvet/50">
                      <td className="py-3 pr-2 font-body text-mist text-sm break-words max-w-[120px] sm:max-w-none">
                        {b.customer_name}
                      </td>
                      <td className="py-3 pr-2 font-body text-lilac text-sm whitespace-nowrap">
                        {b.customer_phone}
                      </td>
                      <td className="py-3 pr-2 font-body text-lilac text-sm max-w-[120px] truncate">
                        {services.find((s) => s.id === b.service_id)?.name || `#${b.service_id}`}
                      </td>
                      <td className="py-3 pr-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-body font-semibold border border-arcane/40 text-lilac whitespace-nowrap">
                          <MeetingMethodIcon
                            method={b.meeting_method === "offline" ? "offline" : "online"}
                            className="w-3.5 h-3.5"
                          />
                          {b.meeting_method === "offline" ? "Off" : "Onl"}
                        </span>
                      </td>
                      <td className="py-3 pr-2 font-body text-lilac text-sm whitespace-nowrap">
                        {b.appointment_date}
                      </td>
                      <td className="py-3 pr-2 font-body text-lilac text-sm whitespace-nowrap">
                        {b.appointment_time}
                      </td>
                      <td className="py-3 pr-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-body font-semibold border ${getStatusBadge(b.status)}`}
                        >
                          {b.status === "pending" ? "Chờ" : b.status === "confirmed" ? "Đã XN" : "Đã hủy"}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {b.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleStatus(b.id, "confirmed")}
                                className={statusBtn("confirm", "XN")}
                              >
                                ✓ XN
                              </button>
                              <button
                                onClick={() => handleStatus(b.id, "cancelled")}
                                className={statusBtn("cancel", "Hủy")}
                              >
                                ✕ Hủy
                              </button>
                            </>
                          )}
                          {b.status === "confirmed" && (
                            <button
                              onClick={() => handleStatus(b.id, "cancelled")}
                              className={statusBtn("cancel", "Hủy")}
                            >
                              ✕ Hủy
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBooking(b.id)}
                            className={statusBtn("delete", "Xóa")}
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                        <td colSpan={8} className="py-8 text-center font-body text-lilac/50 italic">
                        Chưa có lịch hẹn nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ──── Services tab ──── */}
        {tab === "services" && (
          <section>
            <div className="flex justify-end mb-4">
              <button
                onClick={openNewService}
                className="px-4 py-2 rounded-xl font-display text-xs tracking-widest uppercase bg-arcane text-mist hover:bg-arcane/80 transition-all"
              >
                + Thêm dịch vụ
              </button>
            </div>

            {/* Service form */}
            {showServiceForm && (
              <div className="bg-velvet/60 border border-velvet rounded-xl p-6 mb-6 space-y-4">
                <h3 className="font-display text-base tracking-wider uppercase text-mist">
                  {editService ? "Sửa dịch vụ" : "Thêm dịch vụ mới"}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-body text-lilac text-sm mb-1">Tên</label>
                    <input
                      type="text"
                      value={svcName}
                      onChange={(e) => setSvcName(e.target.value)}
                      className="w-full bg-void border border-velvet rounded-lg px-3 py-2 font-body text-mist focus:outline-none focus:border-arcane"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-lilac text-sm mb-1">Giá (VNĐ)</label>
                    <input
                      type="number"
                      value={svcPrice}
                      onChange={(e) => setSvcPrice(Number(e.target.value))}
                      className="w-full bg-void border border-velvet rounded-lg px-3 py-2 font-body text-mist focus:outline-none focus:border-arcane"
                    />
                  </div>
                  <div>
                    <label className="block font-body text-lilac text-sm mb-1">Thời lượng (phút)</label>
                    <input
                      type="number"
                      value={svcDuration}
                      onChange={(e) => setSvcDuration(Number(e.target.value))}
                      className="w-full bg-void border border-velvet rounded-lg px-3 py-2 font-body text-mist focus:outline-none focus:border-arcane"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={svcActive}
                        onChange={(e) => setSvcActive(e.target.checked)}
                        className="accent-arcane w-4 h-4"
                      />
                      <span className="font-body text-lilac text-sm">Hiển thị</span>
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-body text-lilac text-sm mb-1">Mô tả</label>
                    <textarea
                      value={svcDesc}
                      onChange={(e) => setSvcDesc(e.target.value)}
                      rows={2}
                      className="w-full bg-void border border-velvet rounded-lg px-3 py-2 font-body text-mist focus:outline-none focus:border-arcane resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowServiceForm(false)}
                    className="px-4 py-2 rounded-lg font-body text-lilac border border-velvet hover:border-lilac/30 transition-all text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveService}
                    className="px-4 py-2 rounded-xl font-display text-xs tracking-widest uppercase bg-arcane text-mist hover:bg-arcane/80 transition-all"
                  >
                    {editService ? "Cập nhật" : "Thêm"}
                  </button>
                </div>
              </div>
            )}

            {/* Services list */}
            <div className="grid gap-3">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className={`bg-velvet/60 border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 ${
                    svc.is_active ? "border-velvet" : "border-velvet/30 opacity-60"
                  }`}
                >
                  <div className="flex-1 min-w-[180px]">
                    <h4 className="font-display text-sm tracking-wider uppercase text-mist">
                      {svc.name}
                    </h4>
                    <p className="font-body text-lilac text-sm mt-0.5 whitespace-pre-line">{svc.description}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 font-body text-xs text-lilac/60">
                      <span>{svc.duration_minutes} phút</span>
                      <span>{svc.price.toLocaleString("vi-VN")}₫</span>
                      <span>{svc.is_active ? "Đang hiện" : "Đã ẩn"}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => openEditService(svc)}
                      className="px-3 py-1.5 rounded-lg text-xs font-body font-semibold bg-arcane/20 text-arcane hover:bg-arcane/30 transition-all"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteService(svc.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-body font-semibold bg-arcane/10 text-lilac hover:bg-arcane/20 transition-all"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
              {services.length === 0 && (
                <p className="text-center font-body text-lilac/50 italic py-8">
                  Chưa có dịch vụ nào
                </p>
              )}
            </div>
          </section>
        )}

        {/* ──── Đăng ký học tab ──── */}
        {tab === "applications" && (
          <section>
            <div className="flex flex-wrap gap-3 mb-4">
              <select
                value={appFilter}
                onChange={(e) => setAppFilter(e.target.value)}
                className="bg-velvet/60 border border-velvet rounded-lg px-3 py-1.5 font-body text-mist text-sm focus:outline-none focus:border-arcane"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xử lý</option>
                <option value="contacted">Đã liên hệ</option>
                <option value="accepted">Đã nhận</option>
                <option value="rejected">Đã từ chối</option>
              </select>
              <button
                onClick={loadApplications}
                className="px-3 py-1.5 rounded-lg font-body text-lilac border border-velvet hover:border-lilac/30 text-sm transition-all"
              >
                Lọc
              </button>
            </div>

            {applications.length === 0 ? (
              <p className="text-center font-body text-lilac/50 italic py-8">
                Chưa có đơn đăng ký nào
              </p>
            ) : (
              <div className="grid gap-4">
                {applications.map((a) => (
                  <div key={a.id} className="bg-velvet/60 border border-velvet rounded-xl p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-[220px]">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-sm tracking-wider uppercase text-mist">
                            {a.full_name}
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-body font-semibold border ${getAppStatusBadge(a.status)}`}
                          >
                            {getAppStatusLabel(a.status)}
                          </span>
                        </div>
                        <p className="font-body text-lilac text-sm mt-1">
                          {a.phone}
                          {a.email ? ` · ${a.email}` : ""}
                        </p>
                        <p className="font-body text-lilac/60 text-xs mt-0.5">
                          {new Date(a.created_at).toLocaleString("vi-VN")}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        {a.status === "pending" && (
                          <button
                            onClick={() => handleAppStatus(a.id, "contacted")}
                            className={statusBtn("confirm", "Đã liên hệ")}
                          >
                            ✓ Đã liên hệ
                          </button>
                        )}
                        {a.status !== "accepted" && a.status !== "rejected" && (
                          <>
                            <button
                              onClick={() => handleAppStatus(a.id, "accepted")}
                              className={statusBtn("confirm", "Nhận")}
                            >
                              Nhận
                            </button>
                            <button
                              onClick={() => handleAppStatus(a.id, "rejected")}
                              className={statusBtn("cancel", "Từ chối")}
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteRegistration(a.id)}
                          className={statusBtn("delete", "Xóa")}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2 border-t border-velvet/50 pt-3">
                      <div>
                        <p className="font-body text-lilac/50 text-xs uppercase tracking-wide mb-0.5">
                          Khóa học
                        </p>
                        <p className="font-body text-mist text-sm whitespace-pre-line">{a.reason}</p>
                      </div>
                      {a.experience && (
                        <div>
                          <p className="font-body text-lilac/50 text-xs uppercase tracking-wide mb-0.5">
                            Lời nhắn
                          </p>
                          <p className="font-body text-lilac text-sm whitespace-pre-line">
                            {a.experience}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ──── Tin nhắn tab ──── */}
        {tab === "messages" && (
          <section>
            <div className="flex flex-wrap gap-3 mb-4">
              <button
                onClick={loadMessages}
                className="px-3 py-1.5 rounded-lg font-body text-lilac border border-velvet hover:border-lilac/30 text-sm transition-all"
              >
                Tải lại
              </button>
            </div>

            {messages.length === 0 ? (
              <p className="text-center font-body text-lilac/50 italic py-8">
                Chưa có tin nhắn nào
              </p>
            ) : (
              <div className="grid gap-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`bg-velvet/60 border rounded-xl p-4 ${
                      m.is_read ? "border-velvet" : "border-candle-gold/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-[220px]">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-sm tracking-wider uppercase text-mist">
                            {m.name}
                          </h4>
                          {!m.is_read && (
                            <span className="px-2 py-0.5 rounded text-xs font-body font-semibold border bg-candle-gold/20 text-candle-gold border-candle-gold/30">
                              Mới
                            </span>
                          )}
                        </div>
                        <p className="font-body text-lilac text-sm mt-1">
                          {m.email}
                          {m.phone ? ` · ${m.phone}` : ""}
                        </p>
                        <p className="font-body text-lilac/60 text-xs mt-0.5">
                          {new Date(m.created_at).toLocaleString("vi-VN")}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 shrink-0">
                        {!m.is_read && (
                          <button
                            onClick={() => handleMarkMessageRead(m.id)}
                            className={statusBtn("confirm", "Đã đọc")}
                          >
                            ✓ Đã đọc
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMessage(m.id)}
                          className={statusBtn("delete", "Xóa")}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-velvet/50 pt-3">
                      <p className="font-body text-mist text-sm whitespace-pre-line">{m.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
