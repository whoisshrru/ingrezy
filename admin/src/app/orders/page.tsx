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
        return "bg-emerald-50 text-emerald-800 border-emerald-300";
      case "PLACED":
        return "bg-blue-50 text-blue-800 border-blue-300";
      case "CONFIRMED":
      case "PREPARING":
        return "bg-amber-50 text-amber-900 border-amber-300";
      case "READY_FOR_PICKUP":
      case "OUT_FOR_DELIVERY":
        return "bg-orange-50 text-orange-900 border-orange-300";
      case "CANCELLED":
        return "bg-red-50 text-red-800 border-red-300";
      default:
        return "bg-stone-100 text-stone-800 border-stone-300";
    }
  };

  const getDeliveryStatusBadge = (status?: string | null, hasPartner: boolean = false) => {
    if (!status || status === "UNASSIGNED" || (!hasPartner && status === "ASSIGNED")) {
      return "bg-amber-50 text-amber-900 border-amber-300";
    }
    switch (status) {
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-800 border-emerald-300";
      case "ASSIGNED":
        return "bg-sky-50 text-sky-800 border-sky-300";
      case "ACCEPTED":
        return "bg-indigo-50 text-indigo-900 border-indigo-300";
      case "PICKED_UP":
      case "ARRIVED_AT_LOCATION":
        return "bg-purple-50 text-purple-900 border-purple-300";
      case "FAILED":
        return "bg-red-50 text-red-800 border-red-300";
      default:
        return "bg-stone-100 text-stone-700 border-stone-300";
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
        return "bg-emerald-50 text-emerald-800 border-emerald-300";
      case "PENDING":
        return "bg-amber-50 text-amber-900 border-amber-300";
      case "FAILED":
      case "REFUNDED":
        return "bg-red-50 text-red-800 border-red-300";
      default:
        return "bg-stone-100 text-stone-800 border-stone-300";
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
            <h2 className="text-xl font-extrabold text-[#504932] tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#B34E22]" />
              <span>Platform Order Management</span>
            </h2>
            <p className="text-xs text-[#7A7056] mt-0.5">
              Live orders across all dark stores, fulfillment pipelines, and delivery statuses
            </p>
          </div>

          <button
            onClick={fetchOrders}
            style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#FAF6ED] text-[#504932] text-xs font-extrabold rounded-xl border border-[#E8E2D5] shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#B34E22] ${isLoading ? "animate-spin" : ""}`} />
            <span style={{ color: "#504932" }} className="font-extrabold text-[#504932]">Refresh Orders</span>
          </button>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {statuses.map((st) => {
            const isActive = statusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  color: isActive ? "#ffffff" : "#504932",
                  backgroundColor: isActive ? "#B34E22" : "#FFFFFF",
                  borderColor: isActive ? "#B34E22" : "#E8E2D5",
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all border cursor-pointer ${
                  isActive
                    ? "bg-[#B34E22] text-white shadow-sm shadow-[#B34E22]/20"
                    : "bg-white text-[#504932] hover:bg-[#FAF6ED] hover:text-[#B34E22]"
                }`}
              >
                <span style={{ color: isActive ? "#ffffff" : "#504932" }} className="font-extrabold">
                  {st}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white border border-[#E8E2D5] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6ED] text-[#504932] uppercase tracking-wider text-[10px] border-b border-[#E8E2D5] font-bold">
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
              <tbody className="divide-y divide-[#F0EAE1] text-[#504932]">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#7A7056]">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#B34E22]" />
                        <span>Loading orders...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#7A7056]">
                      No orders matching selected status.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => openOrderDetails(o.id)}
                      className="hover:bg-[#FAF6ED]/60 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#B34E22] group-hover:text-[#8F3E1A]">
                        {o.orderNumber}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#504932]">{o.storeName}</td>
                      <td className="py-3 px-4 font-semibold text-[#7A7056]">{o.itemsCount} items</td>
                      <td className="py-3 px-4 font-bold text-[#504932] text-sm">₹{o.totalAmount.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-[10px] bg-[#FAF6ED] px-2 py-0.5 rounded text-[#504932] font-semibold border border-[#E8E2D5]">
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
                      <td className="py-3 px-4 text-[#7A7056]">
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
                          style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#B34E22] hover:bg-[#8F3E1A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-white" />
                          <span style={{ color: "#ffffff" }} className="font-bold text-white">View Details</span>
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
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            {/* Click backdrop to close */}
            <div className="flex-1" onClick={closeOrderDetails} />

            <div className="w-full max-w-2xl bg-[#FFFCF5] border-l border-[#E8E2D5] h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
              {/* Drawer Header */}
              <div className="px-6 py-4 bg-white border-b border-[#E8E2D5] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-[#B34E22]" />
                    <span className="font-mono text-base font-extrabold text-[#504932]">
                      {orderDetails?.orderNumber || "Order Details"}
                    </span>
                  </div>
                  <p className="text-xs text-[#7A7056] mt-0.5">
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
                  style={{ color: "#504932", backgroundColor: "#FAF6ED", borderColor: "#E8E2D5" }}
                  className="p-2 rounded-xl text-[#504932] hover:bg-[#EBD3AA] border border-[#E8E2D5] transition-colors cursor-pointer"
                  title="Close Order Details"
                >
                  <X className="w-4 h-4 text-[#504932]" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#FFFCF5]">
                {isLoadingDetails && (
                  <div className="py-20 flex flex-col items-center justify-center text-[#7A7056] gap-3">
                    <RefreshCw className="w-7 h-7 text-[#B34E22] animate-spin" />
                    <p className="text-xs font-semibold">Fetching complete order details & delivery snapshot...</p>
                  </div>
                )}

                {detailsError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold">Failed to load order</p>
                      <p className="mt-1 text-red-600">{detailsError}</p>
                      <button
                        onClick={() => openOrderDetails(selectedOrderId)}
                        className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-xs font-bold transition-all"
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
                      <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] shadow-xs space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#7A7056] uppercase tracking-wider">
                          <Package className="w-3.5 h-3.5 text-[#B34E22]" />
                          <span>Order Status</span>
                        </div>
                        <div>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold border ${getOrderStatusBadge(
                              orderDetails.orderStatus
                            )}`}
                          >
                            {orderDetails.orderStatus}
                          </span>
                        </div>
                        <p className="text-xs text-[#7A7056]">
                          Current stage in dark store fulfillment workflow
                        </p>
                      </div>

                      {/* Delivery Status Card */}
                      <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] shadow-xs space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#7A7056] uppercase tracking-wider">
                          <Bike className="w-3.5 h-3.5 text-[#6A6332]" />
                          <span>Delivery Status</span>
                        </div>
                        <div>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold border ${getDeliveryStatusBadge(
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
                        <p className="text-xs text-[#7A7056]">
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
                    <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#7A7056] uppercase tracking-wider flex items-center gap-2">
                          <Bike className="w-4 h-4 text-[#6A6332]" />
                          <span>Assigned Delivery Partner</span>
                        </h4>

                        <div className="flex items-center gap-2">
                          {orderDetails.delivery?.deliveryPartner ? (
                            orderDetails.delivery.status === "ASSIGNED" ? (
                              <span className="px-2.5 py-0.5 bg-sky-50 text-sky-800 text-xs font-bold rounded-md border border-sky-200">
                                Assigned (Awaiting Acceptance)
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-md border border-emerald-200">
                                Active ({orderDetails.delivery.status})
                              </span>
                            )
                          ) : (
                            <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 text-xs font-bold rounded-md border border-amber-200">
                              Not assigned
                            </span>
                          )}

                          {/* Action Button: Assign / Change Partner */}
                          {canAssignCurrentOrder(orderDetails).allowed ? (
                            <button
                              onClick={() => openAssignPartnerModal(orderDetails.id)}
                              style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                              className="px-3.5 py-1.5 rounded-xl bg-[#B34E22] hover:bg-[#8F3E1A] text-white text-xs font-extrabold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-white" />
                              <span style={{ color: "#ffffff" }} className="text-white font-extrabold">
                                {orderDetails.delivery?.deliveryPartner ? "Change Partner" : "Assign Partner"}
                              </span>
                            </button>
                          ) : (
                            <span
                              title={canAssignCurrentOrder(orderDetails).reason}
                              className="px-2 py-0.5 rounded bg-[#FAF6ED] text-[#7A7056] text-[10px] font-medium border border-[#E8E2D5] flex items-center gap-1 cursor-not-allowed"
                            >
                              <Lock className="w-3 h-3" />
                              <span>{canAssignCurrentOrder(orderDetails).reason}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {orderDetails.delivery?.deliveryPartner ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                          <div className="flex items-center gap-2 text-[#504932] font-bold">
                            <User className="w-3.5 h-3.5 text-[#7A7056]" />
                            <span>{orderDetails.delivery.deliveryPartner.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[#504932]">
                            <Phone className="w-3.5 h-3.5 text-[#7A7056]" />
                            <a
                              href={`tel:${orderDetails.delivery.deliveryPartner.phoneNumber}`}
                              className="text-[#B34E22] font-semibold hover:underline"
                            >
                              +91 {orderDetails.delivery.deliveryPartner.phoneNumber}
                            </a>
                          </div>
                          {orderDetails.delivery.deliveryPartner.email && (
                            <div className="flex items-center gap-2 text-[#7A7056] sm:col-span-2">
                              <Mail className="w-3.5 h-3.5 text-[#9C937E]" />
                              <span>{orderDetails.delivery.deliveryPartner.email}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs text-[#92400E] flex items-center justify-between">
                          <span>No delivery partner has been assigned to this order yet. Click &apos;Assign Partner&apos; above to dispatch an available rider.</span>
                        </div>
                      )}
                    </div>

                    {/* Customer & Delivery Address Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Customer Info */}
                      <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] shadow-xs space-y-2 text-xs">
                        <h4 className="text-xs font-bold text-[#7A7056] uppercase tracking-wider flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#B34E22]" />
                          <span>Customer Details</span>
                        </h4>
                        {orderDetails.customer ? (
                          <div className="space-y-1 pt-1">
                            <p className="font-bold text-[#504932] text-sm">{orderDetails.customer.name}</p>
                            <p className="text-[#504932] flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-[#7A7056]" />
                              <a
                                href={`tel:${orderDetails.customer.phoneNumber}`}
                                className="text-[#B34E22] font-semibold hover:underline"
                              >
                                +91 {orderDetails.customer.phoneNumber}
                              </a>
                            </p>
                            {orderDetails.customer.email && (
                              <p className="text-[#7A7056] flex items-center gap-1.5 text-xs">
                                <Mail className="w-3 h-3 text-[#9C937E]" />
                                <span>{orderDetails.customer.email}</span>
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[#7A7056] text-xs italic">Customer record unavailable</p>
                        )}
                      </div>

                      {/* Store Info */}
                      <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] shadow-xs space-y-2 text-xs">
                        <h4 className="text-xs font-bold text-[#7A7056] uppercase tracking-wider flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-[#6A6332]" />
                          <span>Fulfillment Dark Store</span>
                        </h4>
                        {orderDetails.store ? (
                          <div className="space-y-1 pt-1">
                            <p className="font-bold text-[#504932] text-sm">{orderDetails.store.name}</p>
                            <p className="text-[#7A7056] text-xs">{orderDetails.store.address}</p>
                            <p className="text-[#7A7056] text-xs font-medium">
                              {orderDetails.store.city}, {orderDetails.store.state} - {orderDetails.store.postalCode}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[#7A7056] text-xs italic">Store details unavailable</p>
                        )}
                      </div>
                    </div>

                    {/* Delivery Destination Address */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] shadow-xs space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-[#7A7056] uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#B34E22]" />
                          <span>Delivery Address</span>
                        </h4>
                        {orderDetails.deliveryAddress?.label && (
                          <span className="px-2.5 py-0.5 rounded-md bg-[#FAF6ED] text-[#504932] font-semibold text-xs border border-[#E8E2D5]">
                            {orderDetails.deliveryAddress.label}
                          </span>
                        )}
                      </div>

                      {orderDetails.deliveryAddress ? (
                        <div className="text-[#504932] space-y-1 pt-1 text-xs">
                          <p className="font-semibold text-[#504932]">{orderDetails.deliveryAddress.addressLine1}</p>
                          {orderDetails.deliveryAddress.addressLine2 && (
                            <p className="text-[#7A7056]">{orderDetails.deliveryAddress.addressLine2}</p>
                          )}
                          {orderDetails.deliveryAddress.landmark && (
                            <p className="text-[#7A7056] text-xs">
                              Landmark: {orderDetails.deliveryAddress.landmark}
                            </p>
                          )}
                          <p className="text-[#7A7056] font-medium">
                            {orderDetails.deliveryAddress.city}, {orderDetails.deliveryAddress.state} -{" "}
                            {orderDetails.deliveryAddress.postalCode}
                          </p>
                        </div>
                      ) : (
                        <p className="text-[#7A7056] text-xs italic">Address record unavailable</p>
                      )}

                      {orderDetails.specialInstructions && (
                        <div className="mt-3 p-3 rounded-xl bg-[#FAF6ED] border border-[#E8E2D5] text-xs text-[#504932] flex items-start gap-2">
                          <FileText className="w-3.5 h-3.5 text-[#B34E22] shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-[#B34E22]">Customer Instructions: </span>
                            <span className="text-[#504932]">{orderDetails.specialInstructions}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Ordered Items Table */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-[#7A7056] uppercase tracking-wider flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-[#B34E22]" />
                          <span className="text-[#504932]">Ordered Items ({orderDetails.items.length})</span>
                        </div>
                        <span className="text-[11px] font-normal text-[#7A7056]">Persisted Snapshot</span>
                      </h4>

                      <div className="rounded-2xl border border-[#E8E2D5] overflow-hidden bg-white shadow-xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#FAF6ED] text-[#504932] text-xs uppercase font-bold border-b border-[#E8E2D5]">
                            <tr>
                              <th className="py-3 px-4">Item</th>
                              <th className="py-3 px-4 text-center">Unit Price</th>
                              <th className="py-3 px-4 text-center">Qty</th>
                              <th className="py-3 px-4 text-right">Line Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F0EAE1] text-[#504932]">
                            {orderDetails.items.map((item) => (
                              <tr key={item.id} className="hover:bg-[#FAF6ED]/50 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-[#504932] text-xs">{item.productName}</div>
                                  {item.unit && (
                                    <div className="text-[11px] text-[#7A7056]">{item.unit}</div>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center text-[#7A7056] font-mono">
                                  ₹{item.unitPrice.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-center font-bold text-[#504932]">
                                  × {item.quantity}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-extrabold text-[#B34E22]">
                                  ₹{item.subtotal.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Payment & Financial Breakdown */}
                    <div className="p-4 rounded-2xl bg-white border border-[#E8E2D5] shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-2.5">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[#6A6332]" />
                          <span className="text-xs font-bold text-[#504932] uppercase tracking-wider">
                            Payment Details
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-[#FAF6ED] px-2.5 py-0.5 rounded-md text-[#504932] font-bold border border-[#E8E2D5]">
                            {orderDetails.paymentMethod}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${getPaymentStatusBadge(
                              orderDetails.paymentStatus
                            )}`}
                          >
                            {orderDetails.paymentStatus}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#7A7056]">Items Subtotal</span>
                          <span className="font-mono font-semibold text-[#504932]">₹{orderDetails.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#7A7056]">Delivery Fee</span>
                          <span className="font-mono">
                            {orderDetails.deliveryFee === 0 ? (
                              <span className="text-[#6A6332] font-bold bg-[#F2EFE2] px-2 py-0.5 rounded text-xs">FREE</span>
                            ) : (
                              <span className="font-semibold text-[#504932]">₹{orderDetails.deliveryFee.toFixed(2)}</span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2.5 border-t border-[#E8E2D5] text-sm font-extrabold">
                          <span className="text-[#504932]">Total Amount</span>
                          <span className="font-mono text-[#B34E22] text-base">
                            ₹{orderDetails.totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-3.5 bg-white border-t border-[#E8E2D5] flex items-center justify-between text-xs">
                <span className="text-xs text-[#9C937E] font-mono">
                  {orderDetails ? `ID: ${orderDetails.id}` : ""}
                </span>
                <button
                  onClick={closeOrderDetails}
                  style={{ color: "#504932", backgroundColor: "#FAF6ED", borderColor: "#C8BEA7" }}
                  className="px-6 py-2.5 bg-[#FAF6ED] hover:bg-[#E8DFC9] text-[#504932] font-extrabold rounded-xl border-2 border-[#C8BEA7] transition-all text-xs shadow-xs cursor-pointer"
                >
                  <span style={{ color: "#504932" }} className="font-extrabold text-[#504932]">Close</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ASSIGN DELIVERY PARTNER MODAL */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-lg bg-white border border-[#E8E2D5] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-[#FAF6ED] border-b border-[#E8E2D5] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bike className="w-5 h-5 text-[#6A6332]" />
                  <div>
                    <h3 className="text-sm font-bold text-[#504932]">
                      Assign Delivery Partner
                    </h3>
                    <p className="text-[11px] text-[#7A7056]">
                      {eligibleData?.orderNumber ? `Order: ${eligibleData.orderNumber}` : "Select rider for dispatch"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeAssignPartnerModal}
                  style={{ color: "#504932", backgroundColor: "#FFFFFF", borderColor: "#E8E2D5" }}
                  className="p-2 rounded-xl text-[#504932] hover:bg-[#FAF6ED] border border-[#E8E2D5] transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-4 h-4 text-[#504932]" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleAssignPartnerSubmit} className="p-6 space-y-4 bg-white">
                {isLoadingEligible && (
                  <div className="py-12 flex flex-col items-center justify-center text-[#7A7056] gap-2">
                    <RefreshCw className="w-6 h-6 text-[#6A6332] animate-spin" />
                    <p className="text-xs font-semibold">Fetching eligible delivery partners and current availability...</p>
                  </div>
                )}

                {assignError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{assignError}</span>
                  </div>
                )}

                {assignSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{assignSuccess}</span>
                  </div>
                )}

                {eligibleData && (
                  <>
                    {!eligibleData.canAssign ? (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                        <div className="flex items-center gap-2 font-bold">
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span>Assignment Restricted</span>
                        </div>
                        <p className="text-[11px] text-[#7A7056]">
                          {eligibleData.restrictionReason ||
                            "This order is no longer in an eligible state for partner assignment."}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-[#504932] flex items-center justify-between">
                            <span>Select Delivery Partner:</span>
                            <span className="text-[10px] text-[#7A7056] font-normal">
                              {eligibleData.partners.filter((p) => p.isAvailable).length} available
                            </span>
                          </label>

                          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {/* Option 0: Unassign */}
                            <label
                              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                                selectedPartnerId === ""
                                  ? "bg-[#FFF7ED] border-[#B34E22] shadow-xs"
                                  : "bg-white border-[#E8E2D5] hover:bg-[#FAF6ED]/60"
                              }`}
                            >
                              <input
                                type="radio"
                                name="deliveryPartner"
                                value=""
                                checked={selectedPartnerId === ""}
                                onChange={() => setSelectedPartnerId("")}
                                className="mt-0.5 text-[#B34E22] focus:ring-0"
                              />
                              <div className="text-xs">
                                <span className="font-bold text-[#504932]">
                                  — Unassign Delivery Partner —
                                </span>
                                <p className="text-[11px] text-[#7A7056]">
                                  Release the order back to unassigned state
                                </p>
                              </div>
                            </label>

                            {/* List of eligible delivery partners */}
                            {eligibleData.partners.length === 0 ? (
                              <p className="text-xs text-[#7A7056] italic py-3 text-center">
                                No active delivery partners registered in system.
                              </p>
                            ) : (
                              eligibleData.partners.map((partner) => (
                                <label
                                  key={partner.id}
                                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                                    selectedPartnerId === partner.id
                                      ? "bg-[#FFF7ED] border-[#B34E22] shadow-xs"
                                      : "bg-white border-[#E8E2D5] hover:bg-[#FAF6ED]/60"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="deliveryPartner"
                                    value={partner.id}
                                    checked={selectedPartnerId === partner.id}
                                    onChange={() => setSelectedPartnerId(partner.id)}
                                    className="mt-0.5 text-[#B34E22] focus:ring-0"
                                  />
                                  <div className="flex-1 text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-[#504932] flex items-center gap-1.5">
                                        <span>{partner.name}</span>
                                        {partner.isCurrentPartner && (
                                          <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                            Current
                                          </span>
                                        )}
                                      </span>
                                      {partner.isAvailable ? (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                          ● Available
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] font-bold border border-amber-200">
                                          ▲ Busy ({partner.activeDeliveriesCount} active)
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-[#7A7056] mt-0.5 flex items-center gap-1">
                                      <Phone className="w-3 h-3 text-[#9C937E]" />
                                      <span>+91 {partner.phoneNumber}</span>
                                      {partner.email && (
                                        <>
                                          <span className="text-[#E8E2D5]">•</span>
                                          <span className="text-[#9C937E]">{partner.email}</span>
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
                            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2">
                              <div className="flex items-start gap-2 text-amber-900 font-bold">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                                <span>
                                  Reassigning from {eligibleData.currentPartner.name}
                                </span>
                              </div>
                              <p className="text-[11px] text-amber-800">
                                This order is already assigned. Changing the partner will revoke the
                                current dispatch assignment.
                              </p>
                              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={confirmReassignChecked}
                                  onChange={(e) => setConfirmReassignChecked(e.target.checked)}
                                  className="rounded border-[#E8E2D5] text-[#B34E22] focus:ring-0"
                                />
                                <span className="text-[11px] text-amber-900 font-bold">
                                  I confirm this reassignment override
                                </span>
                              </label>
                            </div>
                          )}

                        {/* Modal Action Buttons */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E2D5]">
                          <button
                            type="button"
                            onClick={closeAssignPartnerModal}
                            style={{ color: "#504932", backgroundColor: "#FAF6ED", borderColor: "#C8BEA7" }}
                            className="px-5 py-2.5 bg-[#FAF6ED] hover:bg-[#E8DFC9] text-[#504932] font-extrabold rounded-xl text-xs border-2 border-[#C8BEA7] transition-all cursor-pointer shadow-xs"
                          >
                            <span style={{ color: "#504932" }} className="font-extrabold text-[#504932]">Cancel</span>
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
                            style={{ color: "#ffffff", backgroundColor: "#B34E22" }}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#B34E22] hover:bg-[#8F3E1A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold rounded-xl text-xs shadow-md shadow-[#B34E22]/25 transition-all cursor-pointer"
                          >
                            {isAssigning && <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />}
                            <span style={{ color: "#ffffff" }} className="text-white font-extrabold">
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
