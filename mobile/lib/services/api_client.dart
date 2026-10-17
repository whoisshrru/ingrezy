import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiResponse<T> {
  final bool isSuccess;
  final T? data;
  final String message;
  final List<String> errors;
  final int statusCode;

  ApiResponse({
    required this.isSuccess,
    this.data,
    this.message = '',
    this.errors = const [],
    this.statusCode = 200,
  });

  factory ApiResponse.success(T data, {String message = '', int statusCode = 200}) {
    return ApiResponse(
      isSuccess: true,
      data: data,
      message: message,
      statusCode: statusCode,
    );
  }

  factory ApiResponse.failure(String message, {List<String> errors = const [], int statusCode = 400}) {
    return ApiResponse(
      isSuccess: false,
      message: message,
      errors: errors,
      statusCode: statusCode,
    );
  }
}

class ApiClient {
  static const String _tokenKey = 'ingrezy_auth_token';
  static final http.Client _client = http.Client();

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  static Future<Map<String, String>> _getHeaders({bool requireAuth = true}) async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (requireAuth) {
      final token = await getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  static Future<ApiResponse<dynamic>> get(
    String url, {
    Map<String, String>? queryParams,
    bool requireAuth = true,
  }) async {
    try {
      var uri = Uri.parse(url);
      if (queryParams != null && queryParams.isNotEmpty) {
        uri = uri.replace(queryParameters: queryParams);
      }
      final headers = await _getHeaders(requireAuth: requireAuth);
      final response = await _client
          .get(uri, headers: headers)
          .timeout(const Duration(seconds: 12));
      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  static Future<ApiResponse<dynamic>> post(
    String url, {
    dynamic body,
    bool requireAuth = true,
  }) async {
    try {
      final uri = Uri.parse(url);
      final headers = await _getHeaders(requireAuth: requireAuth);
      final response = await _client
          .post(uri, headers: headers, body: body != null ? jsonEncode(body) : null)
          .timeout(const Duration(seconds: 15));
      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  static Future<ApiResponse<dynamic>> patch(
    String url, {
    dynamic body,
    bool requireAuth = true,
  }) async {
    try {
      final uri = Uri.parse(url);
      final headers = await _getHeaders(requireAuth: requireAuth);
      final response = await _client
          .patch(uri, headers: headers, body: body != null ? jsonEncode(body) : null)
          .timeout(const Duration(seconds: 15));
      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  static Future<ApiResponse<dynamic>> delete(
    String url, {
    dynamic body,
    bool requireAuth = true,
  }) async {
    try {
      final uri = Uri.parse(url);
      final headers = await _getHeaders(requireAuth: requireAuth);
      final response = await _client
          .delete(uri, headers: headers, body: body != null ? jsonEncode(body) : null)
          .timeout(const Duration(seconds: 15));
      return _handleResponse(response);
    } catch (e) {
      return _handleError(e);
    }
  }

  static ApiResponse<dynamic> _handleResponse(http.Response response) {
    try {
      final decoded = jsonDecode(response.body);
      final hasSuccessKey = decoded is Map && decoded.containsKey('success');
      final isSuccess = hasSuccessKey ? (decoded['success'] == true) : true;
      final message = (decoded is Map && decoded['message'] is String)
          ? decoded['message'] as String
          : '';
      
      List<String> errors = [];
      if (decoded['errors'] != null && decoded['errors'] is List) {
        for (var err in decoded['errors']) {
          if (err is Map && err['message'] != null) {
            errors.add(err['message'].toString());
          } else {
            errors.add(err.toString());
          }
        }
      }

      if (response.statusCode >= 200 && response.statusCode < 300 && isSuccess) {
        return ApiResponse.success(
          decoded['data'] ?? decoded,
          message: message,
          statusCode: response.statusCode,
        );
      } else {
        return ApiResponse.failure(
          message.isNotEmpty ? message : 'Request failed (${response.statusCode})',
          errors: errors,
          statusCode: response.statusCode,
        );
      }
    } catch (_) {
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse.success(response.body, statusCode: response.statusCode);
      }
      return ApiResponse.failure(
        'Server returned invalid response (${response.statusCode})',
        statusCode: response.statusCode,
      );
    }
  }

  static ApiResponse<dynamic> _handleError(dynamic error) {
    if (error is SocketException) {
      return ApiResponse.failure(
        'Cannot connect to Ingrezy server. Please verify backend is running and URL is reachable.',
        statusCode: 503,
      );
    } else if (error is TimeoutException) {
      return ApiResponse.failure(
        'Connection timed out. Server took too long to respond.',
        statusCode: 408,
      );
    }
    return ApiResponse.failure(
      'Network error: ${error.toString()}',
      statusCode: 500,
    );
  }
}
