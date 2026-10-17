import 'order_model.dart';

enum DeliveryStatus {
  ASSIGNED,
  ACCEPTED,
  PICKED_UP,
  ARRIVED_AT_LOCATION,
  DELIVERED,
  FAILED;

  static DeliveryStatus fromString(String? status) {
    switch (status?.toUpperCase()) {
      case 'ACCEPTED':
        return DeliveryStatus.ACCEPTED;
      case 'PICKED_UP':
        return DeliveryStatus.PICKED_UP;
      case 'ARRIVED_AT_LOCATION':
        return DeliveryStatus.ARRIVED_AT_LOCATION;
      case 'DELIVERED':
        return DeliveryStatus.DELIVERED;
      case 'FAILED':
        return DeliveryStatus.FAILED;
      case 'ASSIGNED':
      default:
        return DeliveryStatus.ASSIGNED;
    }
  }

  String toDisplayString() {
    switch (this) {
      case DeliveryStatus.ASSIGNED:
        return 'Assigned to You';
      case DeliveryStatus.ACCEPTED:
        return 'Accepted - Proceed to Store';
      case DeliveryStatus.PICKED_UP:
        return 'Picked Up - Out for Delivery';
      case DeliveryStatus.ARRIVED_AT_LOCATION:
        return 'Arrived at Doorstep';
      case DeliveryStatus.DELIVERED:
        return 'Completed';
      case DeliveryStatus.FAILED:
        return 'Failed';
    }
  }
}

class DeliveryModel {
  final String id;
  final String orderId;
  final String? deliveryPartnerId;
  final DeliveryStatus status;
  final DateTime? pickupTime;
  final DateTime? deliveredTime;
  final double? currentLatitude;
  final double? currentLongitude;
  final OrderModel? order;

  DeliveryModel({
    required this.id,
    required this.orderId,
    this.deliveryPartnerId,
    required this.status,
    this.pickupTime,
    this.deliveredTime,
    this.currentLatitude,
    this.currentLongitude,
    this.order,
  });

  factory DeliveryModel.fromJson(Map<String, dynamic> json) {
    return DeliveryModel(
      id: json['id'] as String? ?? '',
      orderId: json['orderId'] as String? ?? '',
      deliveryPartnerId: json['deliveryPartnerId'] as String?,
      status: DeliveryStatus.fromString(json['status'] as String?),
      pickupTime: json['pickupTime'] != null
          ? DateTime.tryParse(json['pickupTime'] as String)
          : null,
      deliveredTime: json['deliveredTime'] != null
          ? DateTime.tryParse(json['deliveredTime'] as String)
          : null,
      currentLatitude: (json['currentLatitude'] as num?)?.toDouble(),
      currentLongitude: (json['currentLongitude'] as num?)?.toDouble(),
      order: json['order'] != null
          ? OrderModel.fromJson(json['order'] as Map<String, dynamic>)
          : null,
    );
  }
}
