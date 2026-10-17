import 'address_model.dart';

enum OrderStatus {
  PLACED,
  CONFIRMED,
  PREPARING,
  READY_FOR_PICKUP,
  OUT_FOR_DELIVERY,
  DELIVERED,
  CANCELLED;

  static OrderStatus fromString(String? status) {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return OrderStatus.CONFIRMED;
      case 'PREPARING':
        return OrderStatus.PREPARING;
      case 'READY_FOR_PICKUP':
        return OrderStatus.READY_FOR_PICKUP;
      case 'OUT_FOR_DELIVERY':
        return OrderStatus.OUT_FOR_DELIVERY;
      case 'DELIVERED':
        return OrderStatus.DELIVERED;
      case 'CANCELLED':
        return OrderStatus.CANCELLED;
      case 'PLACED':
      default:
        return OrderStatus.PLACED;
    }
  }

  String toDisplayString() {
    switch (this) {
      case OrderStatus.PLACED:
        return 'Order Placed';
      case OrderStatus.CONFIRMED:
        return 'Confirmed';
      case OrderStatus.PREPARING:
        return 'Packing Groceries';
      case OrderStatus.READY_FOR_PICKUP:
        return 'Ready for Pickup';
      case OrderStatus.OUT_FOR_DELIVERY:
        return 'Out for Delivery';
      case OrderStatus.DELIVERED:
        return 'Delivered';
      case OrderStatus.CANCELLED:
        return 'Cancelled';
    }
  }
}

class OrderItemModel {
  final String id;
  final String productId;
  final String productName;
  final double unitPrice;
  final int quantity;
  final double subtotal;

  OrderItemModel({
    required this.id,
    required this.productId,
    required this.productName,
    required this.unitPrice,
    required this.quantity,
    required this.subtotal,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    double parsePrice(dynamic val) {
      if (val == null) return 0.0;
      if (val is num) return val.toDouble();
      return double.tryParse(val.toString()) ?? 0.0;
    }

    return OrderItemModel(
      id: json['id'] as String? ?? '',
      productId: json['productId'] as String? ?? '',
      productName: json['productName'] as String? ?? 'Item',
      unitPrice: parsePrice(json['unitPrice']),
      quantity: (json['quantity'] as num?)?.toInt() ?? 1,
      subtotal: parsePrice(json['subtotal']),
    );
  }
}

class OrderModel {
  final String id;
  final String orderNumber;
  final String userId;
  final String storeId;
  final String? storeName;
  final String addressId;
  final AddressModel? address;
  final double totalAmount;
  final double deliveryFee;
  final OrderStatus orderStatus;
  final String paymentStatus;
  final String paymentMethod;
  final String? specialInstructions;
  final DateTime createdAt;
  final List<OrderItemModel> items;
  final String? deliveryPartnerName;
  final String? deliveryPartnerPhone;
  final String? deliveryStatus;

  OrderModel({
    required this.id,
    required this.orderNumber,
    required this.userId,
    required this.storeId,
    this.storeName,
    required this.addressId,
    this.address,
    required this.totalAmount,
    this.deliveryFee = 0.0,
    required this.orderStatus,
    this.paymentStatus = 'PENDING',
    this.paymentMethod = 'COD',
    this.specialInstructions,
    required this.createdAt,
    this.items = const [],
    this.deliveryPartnerName,
    this.deliveryPartnerPhone,
    this.deliveryStatus,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    double parsePrice(dynamic val) {
      if (val == null) return 0.0;
      if (val is num) return val.toDouble();
      return double.tryParse(val.toString()) ?? 0.0;
    }

    var rawItems = json['items'] as List<dynamic>? ?? [];
    List<OrderItemModel> itemsList = rawItems
        .map((i) => OrderItemModel.fromJson(i as Map<String, dynamic>))
        .toList();

    var storeObj = json['store'] as Map<String, dynamic>?;
    var addressObj = (json['address'] ?? json['deliveryAddress']) as Map<String, dynamic>?;
    var deliveryObj = json['delivery'] as Map<String, dynamic>?;
    var partnerObj = deliveryObj?['deliveryPartner'] as Map<String, dynamic>?;

    return OrderModel(
      id: json['id'] as String? ?? '',
      orderNumber: json['orderNumber'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      storeId: json['storeId'] as String? ?? '',
      storeName: storeObj?['name'] as String?,
      addressId: json['addressId'] as String? ?? '',
      address: addressObj != null ? AddressModel.fromJson(addressObj) : null,
      totalAmount: parsePrice(json['totalAmount']),
      deliveryFee: parsePrice(json['deliveryFee']),
      orderStatus: OrderStatus.fromString(json['orderStatus'] as String?),
      paymentStatus: json['paymentStatus'] as String? ?? 'PENDING',
      paymentMethod: json['paymentMethod'] as String? ?? 'COD',
      specialInstructions: json['specialInstructions'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      items: itemsList,
      deliveryPartnerName: partnerObj?['name'] as String?,
      deliveryPartnerPhone: partnerObj?['phoneNumber'] as String?,
      deliveryStatus: deliveryObj?['status'] as String?,
    );
  }
}
