import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../main.dart';

/// Specification for each realistic grocery product falling into the shopping trolley
class RealisticGroceryItemSpec {
  final String id;
  final String name;
  final String assetPath;
  final double startInterval; // When item begins falling (0.0 - 1.0)
  final double endInterval; // When item lands (0.0 - 1.0)
  final double targetX; // Resting X in basket coordinates (0 - 320)
  final double targetY; // Resting Y in basket coordinates (0 - 325)
  final double startY; // Start Y (above the cart)
  final double width; // Rendered width
  final double height; // Rendered height
  final double targetRotation; // Final resting angle in radians
  final double startRotation; // In-air tumble angle in radians

  const RealisticGroceryItemSpec({
    required this.id,
    required this.name,
    required this.assetPath,
    required this.startInterval,
    required this.endInterval,
    required this.targetX,
    required this.targetY,
    this.startY = -90.0,
    required this.width,
    required this.height,
    required this.targetRotation,
    this.startRotation = -0.35,
  });
}

/// Premium Realistic 3D Shopping Trolley Splash Screen for Ingrezy.
///
/// Features:
/// 1. Realistic 3D Silver Supermarket Trolley with silver chrome wire-mesh basket,
///    red ergonomic handle, chrome chassis, and 4 wheels.
/// 2. 19 Realistic Grocery Products:
///    - Fresh vegetables (7): Tomato, Purple Onion, Potato, Capsicum, Carrot, Green Chillies, Cauliflower
///    - Fresh fruits (4): Red Apple, Yellow Bananas, Orange, Green Grapes
///    - Indian groceries (8): Basmati Rice Bag, Toor Dal Packet, Atta Bag, Sugar Pouch,
///      Sunflower Cooking Oil, Turmeric Haldi, Red Chilli Powder, Royal Garam Masala
/// 3. Physically convincing falling trajectory, in-flight rotation, and damped bounce.
/// 4. Layered 3D wire mesh depth: rear trolley structure -> grocery products -> front chrome wire grid overlay.
/// 5. Full trolley pause, smooth forward roll-out with rotating wheels and loaded grocery vibrations.
/// 6. Smooth cross-fade transition to authentication / role-based router.
class SplashScreen extends StatefulWidget {
  final VoidCallback? onFinished;

  const SplashScreen({super.key, this.onFinished});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _masterController;
  bool _hasNavigated = false;
  Timer? _safetyTimer;

  // The 19 realistic grocery items carefully arranged in layers inside the 320x325 trolley basket
  static const List<RealisticGroceryItemSpec> _items = [
    // --- Foundation / Floor Layer: Heavy staples and large packages (y ~ 118-128) ---
    RealisticGroceryItemSpec(
      id: 'rice_bag',
      name: 'Royal Basmati Rice 5kg',
      assetPath: 'assets/splash/rice_bag.png',
      startInterval: 0.10,
      endInterval: 0.21,
      targetX: 92,
      targetY: 126,
      width: 48,
      height: 56,
      targetRotation: -0.05,
      startRotation: -0.25,
    ),
    RealisticGroceryItemSpec(
      id: 'atta_bag',
      name: 'Chakki Fresh Atta 5kg',
      assetPath: 'assets/splash/atta_bag.png',
      startInterval: 0.13,
      endInterval: 0.24,
      targetX: 134,
      targetY: 124,
      width: 46,
      height: 56,
      targetRotation: 0.04,
      startRotation: 0.30,
    ),
    RealisticGroceryItemSpec(
      id: 'oil_bottle',
      name: 'Sunflower Cooking Oil 1L',
      assetPath: 'assets/splash/oil_bottle.png',
      startInterval: 0.16,
      endInterval: 0.27,
      targetX: 176,
      targetY: 118,
      width: 32,
      height: 62,
      targetRotation: 0.02,
      startRotation: -0.20,
    ),
    RealisticGroceryItemSpec(
      id: 'sugar_packet',
      name: 'Refined Sugar 1kg',
      assetPath: 'assets/splash/sugar_packet.png',
      startInterval: 0.19,
      endInterval: 0.30,
      targetX: 206,
      targetY: 126,
      width: 40,
      height: 52,
      targetRotation: 0.08,
      startRotation: 0.22,
    ),

    // --- Mid Layer 1: Pulses, hearty produce, and large vegetables (y ~ 98-116) ---
    RealisticGroceryItemSpec(
      id: 'dal_packet',
      name: 'Unpolished Toor Dal 1kg',
      assetPath: 'assets/splash/dal_packet.png',
      startInterval: 0.22,
      endInterval: 0.33,
      targetX: 102,
      targetY: 104,
      width: 40,
      height: 50,
      targetRotation: -0.08,
      startRotation: -0.30,
    ),
    RealisticGroceryItemSpec(
      id: 'potato',
      name: 'Fresh Potato',
      assetPath: 'assets/splash/potato.png',
      startInterval: 0.25,
      endInterval: 0.36,
      targetX: 144,
      targetY: 114,
      width: 32,
      height: 32,
      targetRotation: 0.12,
      startRotation: 0.40,
    ),
    RealisticGroceryItemSpec(
      id: 'cauliflower',
      name: 'Fresh Cauliflower',
      assetPath: 'assets/splash/cauliflower.png',
      startInterval: 0.28,
      endInterval: 0.39,
      targetX: 192,
      targetY: 104,
      width: 46,
      height: 48,
      targetRotation: 0.05,
      startRotation: -0.25,
    ),
    RealisticGroceryItemSpec(
      id: 'onion',
      name: 'Red Onion',
      assetPath: 'assets/splash/onion.png',
      startInterval: 0.31,
      endInterval: 0.42,
      targetX: 120,
      targetY: 98,
      width: 32,
      height: 34,
      targetRotation: -0.06,
      startRotation: 0.35,
    ),
    RealisticGroceryItemSpec(
      id: 'capsicum',
      name: 'Green Capsicum',
      assetPath: 'assets/splash/capsicum.png',
      startInterval: 0.34,
      endInterval: 0.45,
      targetX: 168,
      targetY: 102,
      width: 34,
      height: 36,
      targetRotation: 0.06,
      startRotation: -0.28,
    ),

    // --- Mid Layer 2: Fresh fruits & chillies (y ~ 74-88) ---
    RealisticGroceryItemSpec(
      id: 'apple',
      name: 'Fresh Red Apple',
      assetPath: 'assets/splash/apple.png',
      startInterval: 0.37,
      endInterval: 0.48,
      targetX: 96,
      targetY: 82,
      width: 34,
      height: 34,
      targetRotation: -0.04,
      startRotation: 0.30,
    ),
    RealisticGroceryItemSpec(
      id: 'banana',
      name: 'Yellow Bananas Bunch',
      assetPath: 'assets/splash/banana.png',
      startInterval: 0.40,
      endInterval: 0.51,
      targetX: 130,
      targetY: 78,
      width: 48,
      height: 36,
      targetRotation: 0.10,
      startRotation: -0.32,
    ),
    RealisticGroceryItemSpec(
      id: 'orange',
      name: 'Juicy Orange',
      assetPath: 'assets/splash/orange.png',
      startInterval: 0.43,
      endInterval: 0.54,
      targetX: 178,
      targetY: 82,
      width: 34,
      height: 34,
      targetRotation: -0.06,
      startRotation: 0.25,
    ),
    RealisticGroceryItemSpec(
      id: 'grapes',
      name: 'Green Grapes Cluster',
      assetPath: 'assets/splash/grapes.png',
      startInterval: 0.46,
      endInterval: 0.57,
      targetX: 214,
      targetY: 86,
      width: 40,
      height: 42,
      targetRotation: 0.12,
      startRotation: -0.20,
    ),
    RealisticGroceryItemSpec(
      id: 'chillies',
      name: 'Fresh Green Chillies',
      assetPath: 'assets/splash/chillies.png',
      startInterval: 0.49,
      endInterval: 0.60,
      targetX: 154,
      targetY: 74,
      width: 32,
      height: 38,
      targetRotation: -0.15,
      startRotation: 0.38,
    ),

    // --- Top Crown Layer: Spice Masalas, Carrot, and Ripe Tomato (y ~ 50-66) ---
    RealisticGroceryItemSpec(
      id: 'haldi_packet',
      name: 'Turmeric Haldi Powder',
      assetPath: 'assets/splash/haldi_packet.png',
      startInterval: 0.52,
      endInterval: 0.63,
      targetX: 106,
      targetY: 62,
      width: 34,
      height: 44,
      targetRotation: -0.08,
      startRotation: -0.25,
    ),
    RealisticGroceryItemSpec(
      id: 'carrot',
      name: 'Orange Carrot',
      assetPath: 'assets/splash/carrot.png',
      startInterval: 0.55,
      endInterval: 0.66,
      targetX: 138,
      targetY: 60,
      width: 28,
      height: 46,
      targetRotation: 0.22,
      startRotation: 0.45,
    ),
    RealisticGroceryItemSpec(
      id: 'chilli_packet',
      name: 'Red Chilli Powder',
      assetPath: 'assets/splash/chilli_packet.png',
      startInterval: 0.58,
      endInterval: 0.69,
      targetX: 168,
      targetY: 62,
      width: 34,
      height: 44,
      targetRotation: 0.04,
      startRotation: -0.28,
    ),
    RealisticGroceryItemSpec(
      id: 'garam_masala',
      name: 'Shahi Garam Masala',
      assetPath: 'assets/splash/garam_masala.png',
      startInterval: 0.61,
      endInterval: 0.72,
      targetX: 202,
      targetY: 64,
      width: 34,
      height: 44,
      targetRotation: -0.06,
      startRotation: 0.30,
    ),
    RealisticGroceryItemSpec(
      id: 'tomato',
      name: 'Glossy Red Tomato',
      assetPath: 'assets/splash/tomato.png',
      startInterval: 0.64,
      endInterval: 0.74,
      targetX: 134,
      targetY: 50,
      width: 32,
      height: 32,
      targetRotation: 0.05,
      startRotation: -0.35,
    ),
  ];

  @override
  void initState() {
    super.initState();

    _masterController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3500),
    );

    _masterController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _onAnimationCompleted();
      }
    });

    // Run animation
    _masterController.forward();

    // Safety fallback timer
    _safetyTimer = Timer(const Duration(milliseconds: 3900), () {
      if (!_hasNavigated && mounted) {
        _onAnimationCompleted();
      }
    });
  }

  @override
  void dispose() {
    _safetyTimer?.cancel();
    _masterController.dispose();
    super.dispose();
  }

  void _onAnimationCompleted() {
    if (_hasNavigated) return;
    _hasNavigated = true;

    if (widget.onFinished != null) {
      widget.onFinished!();
      return;
    }

    if (!mounted) return;

    Navigator.of(context).pushReplacement(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            const RootRoleRouter(),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          return FadeTransition(opacity: animation, child: child);
        },
        transitionDuration: const Duration(milliseconds: 450),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF7F2),
      body: SafeArea(
        child: AnimatedBuilder(
          animation: _masterController,
          builder: (context, child) {
            final t = _masterController.value;

            // Header fade in (0.00 to 0.12)
            final headerOpacity = ((t / 0.12).clamp(0.0, 1.0));

            // Trolley rollout horizontal translation (interval 0.76 to 0.98)
            final rollProgress = ((t - 0.76) / 0.22).clamp(0.0, 1.0);
            final rollCurved = Curves.easeInOutCubic.transform(rollProgress);
            final trolleyRollX = rollCurved * 460.0;

            // Loaded groceries micro-vibration when moving
            final cartVibrationY = (rollProgress > 0.01 && rollProgress < 0.99)
                ? math.sin(rollCurved * 28 * math.pi) * 1.5
                : 0.0;

            // Wheels rotation angle (in radians)
            final wheelsRotation = rollCurved * 12.0 * math.pi;

            // Status message
            final String statusText;
            if (t < 0.74) {
              statusText = 'Packing fresh groceries...';
            } else if (t < 0.78) {
              statusText = 'Cart loaded with 19 fresh items!';
            } else {
              statusText = 'Delivering fresh to your doorstep...';
            }

            return Stack(
              children: [
                // Clean ambient background gradient
                Positioned.fill(
                  child: Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Color(0xFFFCFBF7),
                          Color(0xFFFAF6EE),
                          Color(0xFFF4ECE0),
                        ],
                      ),
                    ),
                  ),
                ),

                // Main Column Layout
                Column(
                  children: [
                    const SizedBox(height: 14),

                    // Top Branding Section
                    Opacity(
                      opacity: headerOpacity,
                      child: _buildBrandingHeader(),
                    ),

                    // Center 3D Shopping Trolley & Groceries Stage (responsive with FittedBox)
                    Expanded(
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 6,
                          ),
                          child: FittedBox(
                            fit: BoxFit.contain,
                            child: SizedBox(
                              width: 320,
                              height: 325,
                              child: Transform.translate(
                                offset: Offset(trolleyRollX, cartVibrationY),
                                child: Stack(
                                  clipBehavior: Clip.none,
                                  children: [
                                    // Layer 1: Soft contact shadow under trolley
                                    Positioned(
                                      left: 35,
                                      bottom: 10,
                                      width: 250,
                                      height: 28,
                                      child: Container(
                                        decoration: BoxDecoration(
                                          borderRadius: BorderRadius.circular(
                                            100,
                                          ),
                                          boxShadow: const [
                                            BoxShadow(
                                              color: Color(0x38423218),
                                              blurRadius: 18,
                                              spreadRadius: 2,
                                              offset: Offset(0, 4),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),

                                    // Layer 2: 3D Supermarket Trolley Base
                                    Positioned.fill(
                                      child: Image.asset(
                                        'assets/splash/trolley_3d.png',
                                        fit: BoxFit.contain,
                                        errorBuilder:
                                            (context, error, stackTrace) {
                                              return const SizedBox();
                                            },
                                      ),
                                    ),

                                    // Layer 3: The 19 Realistic Grocery Products
                                    ..._items.map(
                                      (spec) => _buildFallingItem(spec, t),
                                    ),

                                    // Layer 4: Front Chrome Wire Mesh Overlay (gives true 3D depth)
                                    Positioned.fill(
                                      child: CustomPaint(
                                        painter: _TrolleyFrontMeshPainter(),
                                      ),
                                    ),

                                    // Layer 5: Rotating Chrome Wheels Hubcaps
                                    Positioned(
                                      left: 51,
                                      top: 248,
                                      width: 24,
                                      height: 24,
                                      child: CustomPaint(
                                        painter: _WheelSpokesPainter(
                                          angle: wheelsRotation,
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      left: 236,
                                      top: 268,
                                      width: 24,
                                      height: 24,
                                      child: CustomPaint(
                                        painter: _WheelSpokesPainter(
                                          angle: wheelsRotation,
                                        ),
                                      ),
                                    ),

                                    // Layer 6: Dynamic Speed Lines when Rolling
                                    if (rollProgress > 0.05 &&
                                        rollProgress < 0.95)
                                      Positioned(
                                        left: -35,
                                        bottom: 40,
                                        child: Opacity(
                                          opacity: math.sin(
                                            rollProgress * math.pi,
                                          ),
                                          child: const _SpeedLinesWidget(),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),

                    // Bottom Progress & Status Section
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 48),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Status Text
                          AnimatedSwitcher(
                            duration: const Duration(milliseconds: 250),
                            child: Text(
                              statusText,
                              key: ValueKey(statusText),
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF6B5844),
                                letterSpacing: 0.3,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Smooth Loading Bar
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: SizedBox(
                              height: 5,
                              child: LinearProgressIndicator(
                                value: t.clamp(0.0, 1.0),
                                backgroundColor: const Color(0xFFEADBCE),
                                valueColor: const AlwaysStoppedAnimation<Color>(
                                  Color(0xFF2E7D32),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 36),
                  ],
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  /// Ingrezy Branding Header with Logo Icon, App Name, Tagline & Category Pill
  Widget _buildBrandingHeader() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // App Icon Badge
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: const Color(0xFFE8D7B8),
            borderRadius: BorderRadius.circular(20),
            boxShadow: const [
              BoxShadow(
                color: Color(0x1F5D401A),
                blurRadius: 16,
                offset: Offset(0, 6),
              ),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: const [
              Icon(
                Icons.restaurant_menu_rounded,
                size: 34,
                color: Color(0xFF3E2723),
              ),
              Positioned(
                right: 8,
                top: 8,
                child: Icon(
                  Icons.eco_rounded,
                  size: 16,
                  color: Color(0xFF2E7D32),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 12),

        // Brand Name
        const Text(
          'Ingrezy',
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: Color(0xFF332314),
            letterSpacing: -0.5,
          ),
        ),

        const SizedBox(height: 4),

        // Tagline
        const Text(
          'Fresh groceries, smarter cooking',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Color(0xFF7A6450),
          ),
        ),

        const SizedBox(height: 10),

        // Quick Delivery Pill Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
          decoration: BoxDecoration(
            color: const Color(0xFFF1E5D1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFDFCAB0), width: 1),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Text('⚡', style: TextStyle(fontSize: 13)),
              SizedBox(width: 6),
              Text(
                '10-Minute Delivery & Recipes',
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF5D401A),
                  letterSpacing: 0.2,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  /// Individual Falling Grocery Item with realistic physics:
  /// Parabolic gravity trajectory, in-air rotation, and damped bounce upon landing.
  Widget _buildFallingItem(RealisticGroceryItemSpec spec, double masterTime) {
    if (masterTime < spec.startInterval) {
      return const SizedBox.shrink();
    }

    final duration = spec.endInterval - spec.startInterval;
    final progress = ((masterTime - spec.startInterval) / duration).clamp(
      0.0,
      1.0,
    );

    // Vertical fall calculation with gravitational acceleration
    final double currentY;
    final double currentRotation;
    final double currentScale;

    if (progress < 1.0) {
      // In-flight falling: easeInCubic gravity acceleration
      final fallCurved = Curves.easeInCubic.transform(progress);
      currentY = spec.startY + (spec.targetY - spec.startY) * fallCurved;

      // In-flight tumble
      currentRotation =
          spec.startRotation +
          (spec.targetRotation - spec.startRotation) * progress;

      // Subtle scale pop from air to cart
      currentScale = 0.85 + 0.15 * progress;
    } else {
      // Landed in cart: subtle damped spring bounce
      final bounceProgress = ((masterTime - spec.endInterval) / 0.08).clamp(
        0.0,
        1.0,
      );
      final bounce = (bounceProgress < 1.0)
          ? math.sin(bounceProgress * math.pi) *
                math.exp(-bounceProgress * 3.5) *
                4.5
          : 0.0;

      currentY = spec.targetY - bounce;
      currentRotation = spec.targetRotation;
      currentScale = 1.0;
    }

    return Positioned(
      left: spec.targetX,
      top: currentY,
      width: spec.width,
      height: spec.height,
      child: Transform.rotate(
        angle: currentRotation,
        child: Transform.scale(
          scale: currentScale,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              // Subtle drop shadow under item when near/in basket
              if (progress > 0.6)
                Positioned(
                  left: 2,
                  bottom: -2,
                  right: 2,
                  height: 6,
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0x33000000),
                          blurRadius: 4 * progress,
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                  ),
                ),

              // Realistic PNG Image Asset
              Image.asset(
                spec.assetPath,
                width: spec.width,
                height: spec.height,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) {
                  return const SizedBox();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Custom Painter for the Front Chrome Wire Mesh of the Supermarket Trolley.
/// This renders in front of the groceries so that products visibly sit inside the basket!
class _TrolleyFrontMeshPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    // Basket Front Face Geometry (on 320x325 bounding box)
    // Top front chrome rim: (82, 70) to (278, 86)
    // Bottom front rail: (98, 174) to (248, 178)
    const topP1 = Offset(82, 70);
    const topP2 = Offset(278, 86);
    const botP1 = Offset(98, 174);
    const botP2 = Offset(248, 178);

    // Chrome Shader for tubular metallic reflections
    final chromeShader = const LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [
        Color(0xFFE8E8E8),
        Color(0xFFFFFFFF),
        Color(0xFFA6A6A6),
        Color(0xFFBDBDBD),
        Color(0xFFD6D6D6),
      ],
      stops: [0.0, 0.25, 0.55, 0.75, 1.0],
    ).createShader(Rect.fromLTRB(70, 65, 290, 185));

    // Chrome Paint
    final chromePaint = Paint()
      ..shader = chromeShader
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    // Specular Highlight Paint (glint on top of rim)
    final glintPaint = Paint()
      ..color = const Color(0xDDFFFFFF)
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 1.0;

    // 1. Draw 16 Vertical Wire Mesh Ribs spanning top rim to bottom rail
    const int verticalCount = 16;
    chromePaint.strokeWidth = 1.6;

    for (int i = 0; i <= verticalCount; i++) {
      final double fraction = i / verticalCount;
      final start = Offset.lerp(topP1, topP2, fraction)!;
      final end = Offset.lerp(botP1, botP2, fraction)!;
      canvas.drawLine(start, end, chromePaint);
    }

    // 2. Draw 3 Intermediate Horizontal Wire Rails
    const int horizontalCount = 3;
    chromePaint.strokeWidth = 1.8;

    for (int j = 1; j <= horizontalCount; j++) {
      final double fraction = j / (horizontalCount + 1);
      final start = Offset.lerp(topP1, botP1, fraction)!;
      final end = Offset.lerp(topP2, botP2, fraction)!;
      canvas.drawLine(start, end, chromePaint);
    }

    // 3. Draw Bottom Tubular Frame Rail
    chromePaint.strokeWidth = 3.0;
    canvas.drawLine(botP1, botP2, chromePaint);

    // 4. Draw Right Corner Bumper Edge
    chromePaint.strokeWidth = 3.5;
    canvas.drawLine(topP2, botP2, chromePaint);

    // 5. Draw Left Corner Support Strut
    chromePaint.strokeWidth = 2.8;
    canvas.drawLine(topP1, botP1, chromePaint);

    // 6. Draw Top Thick Chrome Rim Tube (Master Front Rim)
    chromePaint.strokeWidth = 3.8;
    canvas.drawLine(topP1, topP2, chromePaint);

    // Chrome glint highlight along top edge
    canvas.drawLine(
      Offset(topP1.dx + 4, topP1.dy - 0.8),
      Offset(topP2.dx - 4, topP2.dy - 0.8),
      glintPaint,
    );

    // 7. Right Front Red Corner Plastic Bumper Guard
    final bumperPaint = Paint()
      ..color = const Color(0xFFC62828)
      ..style = PaintingStyle.fill;
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromCenter(center: topP2, width: 8, height: 10),
        const Radius.circular(3),
      ),
      bumperPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Custom Painter for the Rotating Wheel Spokes & Chrome Hubcaps
class _WheelSpokesPainter extends CustomPainter {
  final double angle;

  _WheelSpokesPainter({required this.angle});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2;

    // Chrome Rim
    final rimPaint = Paint()
      ..color = const Color(0xFFD4D4D4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;
    canvas.drawCircle(center, radius - 1.5, rimPaint);

    // Center Chrome Hub
    final hubPaint = Paint()
      ..color = const Color(0xFFEEEEEE)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(center, 3.5, hubPaint);

    // Rotating Spokes
    final spokePaint = Paint()
      ..color = const Color(0xFF9E9E9E)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4
      ..strokeCap = StrokeCap.round;

    const int numSpokes = 5;
    for (int i = 0; i < numSpokes; i++) {
      final double spokeAngle = angle + (i * 2 * math.pi / numSpokes);
      final end = Offset(
        center.dx + (radius - 2.0) * math.cos(spokeAngle),
        center.dy + (radius - 2.0) * math.sin(spokeAngle),
      );
      canvas.drawLine(center, end, spokePaint);
    }
  }

  @override
  bool shouldRepaint(covariant _WheelSpokesPainter oldDelegate) {
    return oldDelegate.angle != angle;
  }
}

/// Dynamic Speed Lines trailing the shopping cart when rolling
class _SpeedLinesWidget extends StatelessWidget {
  const _SpeedLinesWidget();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Container(
          width: 45,
          height: 2.2,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(2),
            color: const Color(0x66B08958),
          ),
        ),
        const SizedBox(height: 6),
        Container(
          width: 70,
          height: 2.5,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(2),
            color: const Color(0x88B08958),
          ),
        ),
        const SizedBox(height: 6),
        Container(
          width: 35,
          height: 2.0,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(2),
            color: const Color(0x55B08958),
          ),
        ),
      ],
    );
  }
}
