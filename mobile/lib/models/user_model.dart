enum UserRole {
  CUSTOMER,
  RETAILER,
  DELIVERY_PARTNER,
  ADMIN;

  static UserRole fromString(String? role) {
    switch (role?.toUpperCase()) {
      case 'RETAILER':
        return UserRole.RETAILER;
      case 'DELIVERY_PARTNER':
        return UserRole.DELIVERY_PARTNER;
      case 'ADMIN':
        return UserRole.ADMIN;
      case 'CUSTOMER':
      default:
        return UserRole.CUSTOMER;
    }
  }

  String toDisplayString() {
    switch (this) {
      case UserRole.CUSTOMER:
        return 'Customer';
      case UserRole.RETAILER:
        return 'Retailer (Store Manager)';
      case UserRole.DELIVERY_PARTNER:
        return 'Delivery Partner';
      case UserRole.ADMIN:
        return 'Administrator';
    }
  }
}

class UserModel {
  final String id;
  final String name;
  final String? email;
  final String phoneNumber;
  final UserRole role;
  final bool isActive;
  final DateTime? createdAt;

  UserModel({
    required this.id,
    required this.name,
    this.email,
    required this.phoneNumber,
    required this.role,
    this.isActive = true,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? 'User',
      email: json['email'] as String?,
      phoneNumber: json['phoneNumber'] as String? ?? '',
      role: UserRole.fromString(json['role'] as String?),
      isActive: json['isActive'] as bool? ?? true,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phoneNumber': phoneNumber,
      'role': role.name,
      'isActive': isActive,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}
