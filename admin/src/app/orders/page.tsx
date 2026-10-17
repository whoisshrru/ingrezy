"use client";

import React, { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { apiClient } from "@/lib/api";
import {
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  Eye,
  CheckCircle2,
  X,
  Clock,
  MapPin,
  User,
  Bike,
  Store,
  CreditCard,
  Phone,
  Mail,
  Package,
  ShieldCheck,
  FileText,
  UserCheck,
  AlertTriangle,
  Lock,
} from "lucide-react";

interface AdminOrder {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  deliveryFee: number;
  storeName: string;
  itemsCount: number;
  deliveryStatus?: string;
  deliveryPartnerId?: string | null;
  createdAt: string;
}

interface CustomerInfo {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string;
}

interface DeliveryAddress {
  id: string;
  label: string;
  addressLine1: string;
  addressLine2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface StoreInfo {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
}

interface OrderDetailItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  unit?: string | null;
  imageUrl?: string | null;
  dietaryType?: string | null;
}

interface DeliveryPartnerInfo {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string | null;
}

interface DeliveryInfo {
  id: string;
  status: string;
  pickupTime?: string | null;
  deliveredTime?: string | null;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  deliveryPartner?: DeliveryPartnerInfo | null;
}

interface AdminOrderDetails {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  specialInstructions?: string | null;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  customer?: CustomerInfo | null;
  deliveryAddress?: DeliveryAddress | null;
  store?: StoreInfo | null;
  items: OrderDetailItem[];
  delivery?: DeliveryInfo | null;
}

interface EligiblePartner {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string | null;
  isActive: boolean;
  activeDeliveriesCount: number;
  isAvailable: boolean;
  isCurrentPartner: boolean;
  availabilityStatus: string;
}

interface EligiblePartnersResponse {
  orderId: string;
  orderNumber: string;
  deliveryId: string;
  deliveryStatus: string;
  canAssign: boolean;
  restrictionReason?: string | null;
  currentPartner?: DeliveryPartnerInfo | null;
  partners: EligiblePartner[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState<string | null>(null);

  // Order Details Drawer State
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<AdminOrderDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Delivery Partner Assignment Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [eligibleData, setEligibleData] = useState<EligiblePartnersResponse | null>(null);
  const [isLoadingEligible, setIsLoadingEligible] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const [confirmReassignChecked, setConfirmReassignChecked] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    const res = await apiClient<{ orders: AdminOrder[] }>("/api/orders");
    if (res.success && res.data) {
      setOrders(res.data.orders);
    } else {
      setError(res.message || "Failed to load orders");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openOrderDetails = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setOrderDetails(null);
    setIsLoadingDetails(true);
    setDetailsError(null);

    const res = await apiClient<{ order: AdminOrderDetails }>(`/api/admin/orders/${orderId}`);
    if (res.success && res.data) {
      setOrderDetails(res.data.order);
    } else {
      setDetailsError(res.message || "Failed to load order details");
    }
    setIsLoadingDetails(false);
  };

  const closeOrderDetails = () => {
    setSelectedOrderId(null);
    setOrderDetails(null);
    setDetailsError(null);
  };

  // Open Partner Assignment Modal
  const openAssignPartnerModal = async (orderId: string) => {
    setIsAssignModalOpen(true);
    setEligibleData(null);
    setIsLoadingEligible(true);
    setAssignError(null);
    setAssignSuccess(null);
    setConfirmReassignChecked(false);

    const res = await apiClient<EligiblePartnersResponse>(
      `/api/admin/orders/${orderId}/eligible-delivery-partners`
    );

    if (res.success && res.data) {
      setEligibleData(res.data);
      setSelectedPartnerId(res.data.currentPartner?.id || "");
    } else {
      setAssignError(res.message || "Failed to load eligible delivery partners");
    }
    setIsLoadingEligible(false);
  };

  const closeAssignPartnerModal = () => {
    setIsAssignModalOpen(false);
    setEligibleData(null);
    setAssignError(null);
    setAssignSuccess(null);
    setConfirmReassignChecked(false);
  };

  // Submit Partner Assignment
  const handleAssignPartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderDetails || !eligibleData) return;

    setIsAssigning(true);
    setAssignError(null);
    setAssignSuccess(null);

    const isReassigning =
      eligibleData.currentPartner &&
      eligibleData.currentPartner.id !== (selectedPartnerId || null);

    const body = {
      deliveryPartnerId: selectedPartnerId ? selectedPartnerId : null,
      confirmReassign: isReassigning ? confirmReassignChecked : true,
    };

    const res = await apiClient<{
      delivery: {
        id: string;
        status: string;
        deliveryPartner?: DeliveryPartnerInfo | null;
      };
    }>(`/api/admin/orders/${orderDetails.id}/delivery-partner`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });

    if (res.success && res.data) {
      setAssignSuccess(res.message || "Delivery partner updated successfully!");
      // Refresh order details drawer and table
      await openOrderDetails(orderDetails.id);
      fetchOrders();
      setTimeout(() => {
        closeAssignPartnerModal();
      }, 1200);
    } else {
      setAssignError(res.message || "Failed to assign delivery partner");
    }
    setIsAssigning(false);
  };

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isAssignModalOpen) {
          closeAssignPartnerModal();
        } else if (selectedOrderId) {
          closeOrderDetails();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedOrderId, isAssignModalOpen]);

  const statuses = [
    "ALL",
    "PLACED",
    "CONFIRMED",
    "PREPARING",
    "READY_FOR_PICKUP",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ];

  const filteredOrders =
    statusFilter === "ALL" ? orders : orders.filter((o) => o.orderStatus === statusFilter);

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "PLACED":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "CONFIRMED":
      case "PREPARING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "READY_FOR_PICKUP":
      case "OUT_FOR_DELIVERY":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "CANCELLED":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getDeliveryStatusBadge = (status?: string | null, hasPartner: boolean = false) => {
    if (!status || status === "UNASSIGNED" || (!hasPartner && status === "ASSIGNED")) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "ASSIGNED":
        return "bg-sky-500/10 text-sky-400 border-sky-500/20";
      case "ACCEPTED":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "PICKED_UP":
      case "ARRIVED_AT_LOCATION":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "FAILED":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-slate-700/30 text-slate-400 border-slate-700";
    }
  };

  const getDeliveryStatusLabel = (status?: string | null, hasPartner: boolean = false) => {
    if (!status || status === "UNASSIGNED" || (!hasPartner && status === "ASSIGNED")) {
      return "UNASSIGNED";
    }
    if (status === "ASSIGNED" && hasPartner) {
      return "ASSIGNED (PENDING)";
    }
    if (status === "ARRIVED_AT_LOCATION") {
      return "ARRIVED AT DOORSTEP";
    }
    if (status === "PICKED_UP") {
      return "PICKED UP (IN TRANSIT)";
    }
    return status;
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "PENDING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "FAILED":
      case "REFUNDED":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  // Determine if order in drawer is eligible for assignment
  const canAssignCurrentOrder = (order: AdminOrderDetails): { allowed: boolean; reason?: string } => {
    if (order.orderStatus === "CANCELLED") {
      return { allowed: false, reason: "Order is cancelled" };
    }
    if (order.orderStatus === "DELIVERED" || order.delivery?.status === "DELIVERED") {
      return { allowed: false, reason: "Order already delivered" };
    }
    if (
      order.delivery?.status === "PICKED_UP" ||
      order.delivery?.status === "ARRIVED_AT_LOCATION"
    ) {
      return { allowed: false, reason: `In-transit (${order.delivery.status})` };
    }
    return { allowed: true };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <span>Platform Order Management</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live orders across all dark stores, fulfillment pipelines, and delivery statuses
            </p>
          </div>

          <button
            onClick={fetchOrders}
            className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Refresh Orders</span>
          </button>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === st
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-sm shadow-emerald-500/20"
                  : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 font-bold">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Dark Store</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4">Delivery</th>
                  <th className="py-3 px-4">Placed At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                        <span>Loading orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No orders matching selected status.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => openOrderDetails(o.id)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400 group-hover:text-emerald-300">
                        {o.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-200">{o.storeName}</td>
                      <td className="py-3 px-4 font-semibold text-slate-300">{o.itemsCount} items</td>
                      <td className="py-3 px-4 font-bold text-white text-sm">₹{o.totalAmount.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700/50">
                          {o.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getOrderStatusBadge(
                            o.orderStatus
                          )}`}
                        >
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getDeliveryStatusBadge(
                            o.deliveryStatus,
                            Boolean(o.deliveryPartnerId)
                          )}`}
                        >
                          {getDeliveryStatusLabel(o.deliveryStatus, Boolean(o.deliveryPartnerId))}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(o.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openOrderDetails(o.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ORDER DETAILS SLIDE-OVER DRAWER */}
        {selectedOrderId && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
            {/* Click backdrop to close */}
            <div className="flex-1" onClick={closeOrderDetails} />

            <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-sm font-bold text-white">
                      {orderDetails?.orderNumber || "Order Details"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {orderDetails
                      ? `Placed on ${new Date(orderDetails.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : "Loading order snapshot..."}
                  </p>
                </div>
                <button
                  onClick={closeOrderDetails}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isLoadingDetails && (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
                    <p className="text-xs">Fetching complete order details & delivery snapshot...</p>
                  </div>
                )}

                {detailsError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold">Failed to load order</p>
                      <p className="mt-1 text-slate-300">{detailsError}</p>
                      <button
                        onClick={() => openOrderDetails(selectedOrderId)}
                        className="mt-3 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-semibold transition-all"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}

                {orderDetails && (
                  <>
                    {/* Status Overview Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Order Status Card */}
                      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          <Package className="w-3.5 h-3.5 text-blue-400" />
                          <span>Order Status</span>
                        </div>
                        <div>
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-extrabold border ${getOrderStatusBadge(
                              orderDetails.orderStatus
                            )}`}
                          >
                            {orderDetails.orderStatus}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Current stage in dark store fulfillment workflow
                        </p>
                      </div>

                      {/* Delivery Status Card */}
                      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          <Bike className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Delivery Status</span>
                        </div>
                        <div>
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-xs font-extrabold border ${getDeliveryStatusBadge(
                              orderDetails.delivery?.status,
                              Boolean(orderDetails.delivery?.deliveryPartner)
                            )}`}
                          >
                            {getDeliveryStatusLabel(
                              orderDetails.delivery?.status,
                              Boolean(orderDetails.delivery?.deliveryPartner)
                            )}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          {!orderDetails.delivery?.deliveryPartner ||
                          orderDetails.delivery?.status === "UNASSIGNED"
                            ? "Awaiting delivery partner assignment"
                            : orderDetails.delivery?.status === "ASSIGNED"
                            ? `Assigned to ${orderDetails.delivery.deliveryPartner.name} • Awaiting mobile acceptance`
                            : orderDetails.delivery?.status === "ACCEPTED"
                            ? `Accepted by ${orderDetails.delivery.deliveryPartner.name} • Heading to dark store`
                            : orderDetails.delivery?.status === "PICKED_UP"
                            ? "Picked up from store • Out for delivery"
                            : orderDetails.delivery?.status === "ARRIVED_AT_LOCATION"
                            ? "Rider arrived at customer doorstep"
                            : orderDetails.delivery?.status === "DELIVERED"
                            ? "Delivered successfully to customer"
                            : "Rider dispatch & doorstep transit state"}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Partner Section with Assignment Action */}
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                          <Bike className="w-4 h-4 text-emerald-400" />
                          <span>Assigned Delivery Partner</span>
                        </h4>

                        <div className="flex items-center gap-2">
                          {orderDetails.delivery?.deliveryPartner ? (
                            orderDetails.delivery.status === "ASSIGNED" ? (
                              <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 text-[10px] font-bold rounded border border-sky-500/20">
                                Assigned (Awaiting Acceptance)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20">
                                Active ({orderDetails.delivery.status})
                              </span>
                            )
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded border border-amber-500/20">
                              Not assigned
                            </span>
                          )}

                          {/* Action Button: Assign / Change Partner */}
                          {canAssignCurrentOrder(orderDetails).allowed ? (
                            <button
                              onClick={() => openAssignPartnerModal(orderDetails.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all flex items-center gap-1.5"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>
                                {orderDetails.delivery?.deliveryPartner ? "Change Partner" : "Assign Partner"}
                              </span>
                            </button>
                          ) : (
                            <span
                              title={canAssignCurrentOrder(orderDetails).reason}
                              className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-500 text-[10px] font-medium border border-slate-700/50 flex items-center gap-1 cursor-not-allowed"
                            >
                              <Lock className="w-3 h-3" />
                              <span>{canAssignCurrentOrder(orderDetails).reason}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {orderDetails.delivery?.deliveryPartner ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                          <div className="flex items-center gap-2 text-slate-200 font-semibold">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{orderDetails.delivery.deliveryPartner.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <a
                              href={`tel:${orderDetails.delivery.deliveryPartner.phoneNumber}`}
                              className="text-emerald-400 hover:underline"
                            >
                              +91 {orderDetails.delivery.deliveryPartner.phoneNumber}
                            </a>
                          </div>
                          {orderDetails.delivery.deliveryPartner.email && (
                            <div className="flex items-center gap-2 text-slate-400 sm:col-span-2">
                              <Mail className="w-3.5 h-3.5 text-slate-500" />
                              <span>{orderDetails.delivery.deliveryPartner.email}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-[11px] text-amber-300/80 flex items-center justify-between">
                          <span>No delivery partner has been assigned to this order yet. Click &apos;Assign Partner&apos; above to dispatch an available rider.</span>
                        </div>
                      )}
                    </div>

                    {/* Customer & Delivery Address Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Customer Info */}
                      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2 text-xs">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          <span>Customer Details</span>
                        </h4>
                        {orderDetails.customer ? (
                          <div className="space-y-1.5 pt-1">
                            <p className="font-bold text-white text-sm">{orderDetails.customer.name}</p>
                            <p className="text-slate-300 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <a
                                href={`tel:${orderDetails.customer.phoneNumber}`}
                                className="text-emerald-400 hover:underline"
                              >
                                +91 {orderDetails.customer.phoneNumber}
                              </a>
                            </p>
                            {orderDetails.customer.email && (
                              <p className="text-slate-400 flex items-center gap-1.5 text-[11px]">
                                <Mail className="w-3 h-3 text-slate-500" />
                                <span>{orderDetails.customer.email}</span>
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-500 text-xs italic">Customer record unavailable</p>
                        )}
                      </div>

                      {/* Store Info */}
                      <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2 text-xs">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-purple-400" />
                          <span>Fulfillment Dark Store</span>
                        </h4>
                        {orderDetails.store ? (
                          <div className="space-y-1 pt-1">
                            <p className="font-bold text-white">{orderDetails.store.name}</p>
                            <p className="text-slate-300 text-[11px]">{orderDetails.store.address}</p>
                            <p className="text-slate-400 text-[11px]">
                              {orderDetails.store.city}, {orderDetails.store.state} - {orderDetails.store.postalCode}
                            </p>
                          </div>
                        ) : (
                          <p className="text-slate-500 text-xs italic">Store details unavailable</p>
                        )}
                      </div>
                    </div>

                    {/* Delivery Destination Address */}
                    <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Delivery Address</span>
                        </h4>
                        {orderDetails.deliveryAddress?.label && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                            {orderDetails.deliveryAddress.label}
                          </span>
                        )}
                      </div>

                      {orderDetails.deliveryAddress ? (
                        <div className="text-slate-300 space-y-0.5 pt-1 text-xs">
                          <p className="font-medium text-white">{orderDetails.deliveryAddress.addressLine1}</p>
                          {orderDetails.deliveryAddress.addressLine2 && (
                            <p>{orderDetails.deliveryAddress.addressLine2}</p>
                          )}
                          {orderDetails.deliveryAddress.landmark && (
                            <p className="text-slate-400 text-[11px]">
                              Landmark: {orderDetails.deliveryAddress.landmark}
                            </p>
                          )}
                          <p className="text-slate-400 font-medium">
                            {orderDetails.deliveryAddress.city}, {orderDetails.deliveryAddress.state} -{" "}
                            {orderDetails.deliveryAddress.postalCode}
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-500 text-xs italic">Address record unavailable</p>
                      )}

                      {orderDetails.specialInstructions && (
                        <div className="mt-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                          <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-amber-300">Customer Instructions: </span>
                            <span>{orderDetails.specialInstructions}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ordered Items Table */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-emerald-400" />
                          <span>Ordered Items ({orderDetails.items.length})</span>
                        </div>
                        <span className="text-[11px] font-normal text-slate-500">Persisted Snapshot</span>
                      </h4>

                      <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/40">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3">Item</th>
                              <th className="py-2.5 px-3 text-center">Unit Price</th>
                              <th className="py-2.5 px-3 text-center">Qty</th>
                              <th className="py-2.5 px-3 text-right">Line Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 text-slate-300">
                            {orderDetails.items.map((item) => (
                              <tr key={item.id} className="hover:bg-slate-800/30">
                                <td className="py-2.5 px-3">
                                  <div className="font-medium text-white">{item.productName}</div>
                                  {item.unit && (
                                    <div className="text-[10px] text-slate-400">{item.unit}</div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                                  ₹{item.unitPrice.toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-slate-200">
                                  × {item.quantity}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                                  ₹{item.subtotal.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Payment & Financial Breakdown */}
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                            Payment Details
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                            {orderDetails.paymentMethod}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPaymentStatusBadge(
                              orderDetails.paymentStatus
                            )}`}
                          >
                            {orderDetails.paymentStatus}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Items Subtotal</span>
                          <span className="font-mono">₹{orderDetails.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Delivery Fee</span>
                          <span className="font-mono">
                            {orderDetails.deliveryFee === 0 ? (
                              <span className="text-emerald-400 font-semibold">FREE</span>
                            ) : (
                              `₹${orderDetails.deliveryFee.toFixed(2)}`
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-bold">
                          <span className="text-white">Total Amount</span>
                          <span className="font-mono text-emerald-400">
                            ₹{orderDetails.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-mono">
                  {orderDetails ? `ID: ${orderDetails.id}` : ""}
                </span>
                <button
                  onClick={closeOrderDetails}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ASSIGN DELIVERY PARTNER MODAL */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bike className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Assign Delivery Partner
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {eligibleData?.orderNumber ? `Order: ${eligibleData.orderNumber}` : "Select rider for dispatch"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeAssignPartnerModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleAssignPartnerSubmit} className="p-6 space-y-4">
                {isLoadingEligible && (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
                    <p className="text-xs">Fetching eligible delivery partners and current availability...</p>
                  </div>
                )}

                {assignError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{assignError}</span>
                  </div>
                )}

                {assignSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{assignSuccess}</span>
                  </div>
                )}

                {eligibleData && (
                  <>
                    {!eligibleData.canAssign ? (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-1">
                        <div className="flex items-center gap-2 font-bold">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Assignment Restricted</span>
                        </div>
                        <p className="text-[11px] text-slate-300">
                          {eligibleData.restrictionReason ||
                            "This order is no longer in an eligible state for partner assignment."}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                            <span>Select Delivery Partner:</span>
                            <span className="text-[10px] text-slate-500">
                              {eligibleData.partners.filter((p) => p.isAvailable).length} available
                            </span>
                          </label>

                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {/* Option 0: Unassign */}
                            <label
                              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                selectedPartnerId === ""
                                  ? "bg-slate-800/90 border-emerald-500/50 shadow-sm"
                                  : "bg-slate-950/40 border-slate-800 hover:bg-slate-800/40"
                              }`}
                            >
                              <input
                                type="radio"
                                name="deliveryPartner"
                                value=""
                                checked={selectedPartnerId === ""}
                                onChange={() => setSelectedPartnerId("")}
                                className="mt-0.5 text-emerald-500 focus:ring-0"
                              />
                              <div className="text-xs">
                                <span className="font-semibold text-slate-300">
                                  — Unassign Delivery Partner —
                                </span>
                                <p className="text-[11px] text-slate-500">
                                  Release the order back to unassigned state
                                </p>
                              </div>
                            </label>

                            {/* List of eligible delivery partners */}
                            {eligibleData.partners.length === 0 ? (
                              <p className="text-xs text-slate-500 italic py-3 text-center">
                                No active delivery partners registered in system.
                              </p>
                            ) : (
                              eligibleData.partners.map((partner) => (
                                <label
                                  key={partner.id}
                                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                                    selectedPartnerId === partner.id
                                      ? "bg-slate-800/90 border-emerald-500/60 shadow-sm"
                                      : "bg-slate-950/40 border-slate-800 hover:bg-slate-800/40"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="deliveryPartner"
                                    value={partner.id}
                                    checked={selectedPartnerId === partner.id}
                                    onChange={() => setSelectedPartnerId(partner.id)}
                                    className="mt-0.5 text-emerald-500 focus:ring-0"
                                  />
                                  <div className="flex-1 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-white flex items-center gap-1.5">
                                        <span>{partner.name}</span>
                                        {partner.isCurrentPartner && (
                                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20">
                                            Current
                                          </span>
                                        )}
                                      </span>
                                      {partner.isAvailable ? (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                          ● Available
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                                          ▲ Busy ({partner.activeDeliveriesCount} active)
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-slate-500" />
                                      <span>+91 {partner.phoneNumber}</span>
                                      {partner.email && (
                                        <>
                                          <span className="text-slate-600">•</span>
                                          <span className="text-slate-500">{partner.email}</span>
                                        </>
                                      )}
                                    </p>
                                  </div>
                                </label>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Reassignment Safeguard Warning */}
                        {eligibleData.currentPartner &&
                          eligibleData.currentPartner.id !== (selectedPartnerId || null) && (
                            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-2">
                              <div className="flex items-start gap-2 text-amber-300 font-semibold">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>
                                  Reassigning from {eligibleData.currentPartner.name}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300">
                                This order is already assigned. Changing the partner will revoke the
                                current dispatch assignment.
                              </p>
                              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={confirmReassignChecked}
                                  onChange={(e) => setConfirmReassignChecked(e.target.checked)}
                                  className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0"
                                />
                                <span className="text-[11px] text-amber-200 font-medium">
                                  I confirm this reassignment override
                                </span>
                              </label>
                            </div>
                          )}

                        {/* Modal Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={closeAssignPartnerModal}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs border border-slate-700 transition-all"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={
                              Boolean(
                                isAssigning ||
                                  (eligibleData.currentPartner &&
                                    eligibleData.currentPartner.id !== (selectedPartnerId || null) &&
                                    !confirmReassignChecked)
                              )
                            }
                            className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all"
                          >
                            {isAssigning && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                            <span>
                              {selectedPartnerId === ""
                                ? "Unassign Partner"
                                : eligibleData.currentPartner
                                ? "Confirm Reassignment"
                                : "Assign Partner"}
                            </span>
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
