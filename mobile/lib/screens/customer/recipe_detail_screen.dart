import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../providers/cart_provider.dart';
import '../../providers/product_provider.dart';
import '../../providers/recipe_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../utils/content_localizer.dart';
import 'cart_screen.dart';

class RecipeDetailScreen extends StatefulWidget {
  final String recipeId;
  const RecipeDetailScreen({super.key, required this.recipeId});

  @override
  State<RecipeDetailScreen> createState() => _RecipeDetailScreenState();
}

class _RecipeDetailScreenState extends State<RecipeDetailScreen> {
  bool _isBundling = false;
  final Set<String> _alreadyHaveProductIds = <String>{};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<RecipeProvider>(context, listen: false)
          .fetchRecipeDetails(widget.recipeId);
    });
  }

  Future<void> _handleBundleCart(String storeId, int servings) async {
    if (_isBundling) return; // Prevent duplicate rapid taps
    setState(() => _isBundling = true);

    final l10n = AppLocalizations.of(context);
    final cartProv = Provider.of<CartProvider>(context, listen: false);

    // Check if cart has items from another store
    if (cartProv.hasItems && cartProv.cart?.storeId != null && cartProv.cart!.storeId != storeId) {
      final shouldSwitch = await showDialog<bool>(
        context: context,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(l10n.switchStoreTitle, style: const TextStyle(fontWeight: FontWeight.bold)),
          content: Text(l10n.switchStoreRecipeMessage),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(l10n.cancel),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryGreen),
              child: Text(l10n.switchStoreAndAdd),
            ),
          ],
        ),
      );

      if (shouldSwitch != true) {
        setState(() => _isBundling = false);
        return;
      }

      await cartProv.clearCart();
    }

    final recipeProv = Provider.of<RecipeProvider>(context, listen: false);
    final recipe = recipeProv.selectedRecipe;
    final purchasable = recipe?.ingredients.where((i) => i.hasLinkedProduct).toList() ?? [];
    if (purchasable.isEmpty) {
      setState(() => _isBundling = false);
      return;
    }

    final validExclusions = _alreadyHaveProductIds
        .where((id) => purchasable.any((i) => i.productId == id))
        .toList();

    // Use resolved recipe.id from database, falling back to widget.recipeId
    final targetRecipeId = (recipe != null && recipe.id.isNotEmpty) ? recipe.id : widget.recipeId;

    final success = await cartProv.bundleRecipe(
      recipeId: targetRecipeId,
      storeId: storeId,
      servings: servings,
      clearPrevious: true,
      excludeProductIds: validExclusions,
    );

    setState(() => _isBundling = false);

    if (!mounted) return;

    if (success) {
      final result = cartProv.lastBundleResult;
      final unavailable = (result?['unavailableIngredients'] as List<dynamic>?) ?? [];
      final addedCount = (result?['addedItemsCount'] as num?)?.toInt() ?? 0;
      final allExcluded = (result?['allExcluded'] as bool?) ?? false;
      final excludedCount = (result?['excludedIngredientsCount'] as num?)?.toInt() ?? _alreadyHaveProductIds.length;

      if (allExcluded) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF0284C7),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            content: Text(l10n.allInPantrySnack),
          ),
        );
      } else if (addedCount == 0 && unavailable.isNotEmpty) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: Row(
              children: [
                const Icon(Icons.warning_amber_rounded, color: Colors.orange),
                const SizedBox(width: 8),
                Text(l10n.itemsUnavailableTitle, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.itemsUnavailableMessage,
                  style: const TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 10),
                ...unavailable.map((u) {
                  final name = u['productName'] ?? l10n.ingredients;
                  final reason = u['reason'] ?? l10n.outOfStock;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Text('• $name ($reason)', style: const TextStyle(fontSize: 12, color: Colors.redAccent)),
                  );
                }),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text(l10n.ok),
              ),
            ],
          ),
        );
      } else if (unavailable.isNotEmpty) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: Row(
              children: [
                const Icon(Icons.info_outline, color: Colors.orange),
                const SizedBox(width: 8),
                Text(l10n.partialRecipeBundle, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  l10n.partialBundleMessage(addedCount, excludedCount),
                  style: const TextStyle(fontSize: 13),
                ),
                const SizedBox(height: 10),
                ...unavailable.map((u) {
                  final name = u['productName'] ?? l10n.ingredients;
                  final reason = u['reason'] ?? l10n.outOfStock;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Text('• $name ($reason)', style: const TextStyle(fontSize: 12, color: Colors.redAccent)),
                  );
                }),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: Text(l10n.ok),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen()));
                },
                child: Text(l10n.viewCart),
              ),
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.primaryGreen,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            content: Text(
              excludedCount > 0
                  ? l10n.recipeAddedSnack(addedCount, excludedCount)
                  : l10n.allRecipeAddedSnack(addedCount),
            ),
            action: SnackBarAction(
              label: l10n.viewCart.toUpperCase(),
              textColor: Colors.white,
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen()));
              },
            ),
          ),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Colors.redAccent,
          content: Text(cartProv.errorMessage ?? l10n.somethingWentWrong),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<RecipeProvider, ProductProvider>(
      builder: (context, recipeProv, prodProv, child) {
        final l10n = AppLocalizations.of(context);
        final recipe = recipeProv.selectedRecipe;
        final cartProv = Provider.of<CartProvider>(context);
        final effectiveStoreId = (cartProv.itemCount > 0 &&
                cartProv.cart?.storeId != null &&
                cartProv.cart!.storeId!.isNotEmpty)
            ? cartProv.cart!.storeId!
            : (prodProv.selectedStoreId ??
                (prodProv.stores.isNotEmpty ? prodProv.stores.first['id'] as String? : null) ??
                '');

        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            title: Text(recipe?.title ?? l10n.smartRecipes),
            actions: [
              if (recipe != null) ...[
                StatusBadge.fromDietaryType(recipe.dietaryType),
                const SizedBox(width: 4),
              ],
              IconButton(
                tooltip: l10n.navCart,
                icon: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    const Icon(Icons.shopping_bag_outlined),
                    if (cartProv.itemCount > 0)
                      Positioned(
                        right: -4,
                        top: -4,
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(
                            color: AppTheme.accentOrange,
                            shape: BoxShape.circle,
                          ),
                          constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                          child: Text(
                            '${cartProv.itemCount}',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const CartScreen()),
                  );
                },
              ),
              const SizedBox(width: 8),
            ],
          ),
          body: recipeProv.isLoading && recipe == null
              ? LoadingView(message: l10n.loading)
              : recipeProv.errorMessage != null && recipe == null
                  ? ErrorStateView(
                      message: recipeProv.errorMessage!,
                      title: l10n.somethingWentWrong,
                      retryLabel: l10n.retry,
                      onRetry: () => recipeProv.fetchRecipeDetails(widget.recipeId),
                    )
                  : recipe == null
                      ? EmptyStateView(
                          icon: Icons.error_outline,
                          title: l10n.noRecipesFound,
                          description: l10n.somethingWentWrong,
                        )
                      : Column(
                          children: [
                            Expanded(
                              child: SingleChildScrollView(
                                padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Image Banner with Cuisine & Badges
                                    Stack(
                                      children: [
                                        AspectRatio(
                                          aspectRatio: 16 / 10,
                                          child: Container(
                                            width: double.infinity,
                                            decoration: BoxDecoration(
                                              borderRadius: BorderRadius.circular(16),
                                              color: const Color(0xFFE2E8F0),
                                            ),
                                            clipBehavior: Clip.antiAlias,
                                            child: recipe.imageUrl != null && recipe.imageUrl!.isNotEmpty
                                                ? Image.network(
                                                    recipe.imageUrl!,
                                                    width: double.infinity,
                                                    height: double.infinity,
                                                    fit: BoxFit.cover,
                                                    errorBuilder: (_, __, ___) => const Center(
                                                      child: Icon(Icons.restaurant_menu_rounded, size: 56, color: Color(0xFF94A3B8)),
                                                    ),
                                                  )
                                                : const Center(
                                                    child: Icon(Icons.restaurant_menu_rounded, size: 56, color: Color(0xFF94A3B8)),
                                                  ),
                                          ),
                                        ),
                                        Positioned(
                                          top: 12,
                                          left: 12,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                            decoration: BoxDecoration(
                                              color: Colors.white.withOpacity(0.95),
                                              borderRadius: BorderRadius.circular(8),
                                              boxShadow: [
                                                BoxShadow(color: Colors.black.withOpacity(0.12), blurRadius: 4),
                                              ],
                                            ),
                                            child: Text(
                                              recipe.localizedCuisine(context),
                                              style: const TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w800,
                                                color: AppTheme.primaryDark,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 16),

                                    // Title & Description
                                    Text(
                                      recipe.localizedTitle(context),
                                      style: const TextStyle(
                                        fontSize: 22,
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.textDark,
                                      ),
                                    ),
                                    if (recipe.description != null) ...[
                                      const SizedBox(height: 6),
                                      Text(
                                        recipe.localizedDescription(context) ?? recipe.description!,
                                        style: const TextStyle(
                                          fontSize: 14,
                                          color: AppTheme.textMuted,
                                          height: 1.4,
                                        ),
                                      ),
                                    ],
                                    const SizedBox(height: 16),

                                    // Stats Row: Prep Time, Cook Time, Total Time, Difficulty
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(color: const Color(0xFFE2E8F0)),
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                                        children: [
                                          _buildStatItem(l10n.prepTime, '${recipe.prepTimeMinutes}m'),
                                          Container(width: 1, height: 26, color: const Color(0xFFE2E8F0)),
                                          _buildStatItem(l10n.cookTime, '${recipe.cookTimeMinutes}m'),
                                          Container(width: 1, height: 26, color: const Color(0xFFE2E8F0)),
                                          _buildStatItem(l10n.totalTime, '${recipe.totalTimeMinutes}m'),
                                          Container(width: 1, height: 26, color: const Color(0xFFE2E8F0)),
                                          _buildStatItem(l10n.difficulty, recipe.difficulty),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 20),

                                    // Servings Controls Bar
                                    Container(
                                      padding: const EdgeInsets.all(16),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(14),
                                        border: Border.all(color: AppTheme.primaryGreen.withOpacity(0.3)),
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    l10n.portionAndServings,
                                                    style: const TextStyle(
                                                      fontWeight: FontWeight.w800,
                                                      fontSize: 15,
                                                      color: AppTheme.textDark,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    l10n.baseRecipeServes(recipe.baseServings),
                                                    style: const TextStyle(
                                                      fontSize: 12,
                                                      color: AppTheme.textMuted,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                              // Compact Servings Stepper
                                              Container(
                                                decoration: BoxDecoration(
                                                  color: AppTheme.mintLight,
                                                  borderRadius: BorderRadius.circular(10),
                                                  border: Border.all(color: AppTheme.primaryGreen),
                                                ),
                                                child: Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    IconButton(
                                                      icon: const Icon(Icons.remove, size: 18, color: AppTheme.primaryGreen),
                                                      padding: const EdgeInsets.all(6),
                                                      constraints: const BoxConstraints(),
                                                      onPressed: recipeProv.currentServings > 1
                                                          ? () => recipeProv.updateServings(recipeProv.currentServings - 1)
                                                          : null,
                                                    ),
                                                    Padding(
                                                      padding: const EdgeInsets.symmetric(horizontal: 10),
                                                      child: Text(
                                                        '${recipeProv.currentServings}',
                                                        style: const TextStyle(
                                                          fontWeight: FontWeight.w800,
                                                          color: AppTheme.primaryDark,
                                                          fontSize: 16,
                                                        ),
                                                      ),
                                                    ),
                                                    IconButton(
                                                      icon: const Icon(Icons.add, size: 18, color: AppTheme.primaryGreen),
                                                      padding: const EdgeInsets.all(6),
                                                      constraints: const BoxConstraints(),
                                                      onPressed: () => recipeProv.updateServings(recipeProv.currentServings + 1),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 12),
                                          // Quick Servings Preset Chips: 2, 4, 6, 8
                                          Row(
                                            children: [2, 4, 6, 8].map((s) {
                                              final isSelected = recipeProv.currentServings == s;
                                              return Padding(
                                                padding: const EdgeInsets.only(right: 8),
                                                child: InkWell(
                                                  onTap: () => recipeProv.updateServings(s),
                                                  borderRadius: BorderRadius.circular(8),
                                                  child: Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                                    decoration: BoxDecoration(
                                                      color: isSelected ? AppTheme.primaryGreen : const Color(0xFFF1F5F9),
                                                      borderRadius: BorderRadius.circular(8),
                                                      border: Border.all(
                                                        color: isSelected ? AppTheme.primaryGreen : const Color(0xFFCBD5E1),
                                                      ),
                                                    ),
                                                    child: Text(
                                                      '$s ${l10n.servings}',
                                                      style: TextStyle(
                                                        fontSize: 12,
                                                        fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                                        color: isSelected ? Colors.white : AppTheme.textDark,
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              );
                                            }).toList(),
                                          ),
                                        ],
                                      ),
                                    ),
                                    const SizedBox(height: 24),

                                    // Ingredients List Section
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Text(
                                                  '${l10n.ingredients} (${recipe.ingredients.length})',
                                                  style: const TextStyle(
                                                    fontSize: 17,
                                                    fontWeight: FontWeight.w800,
                                                    color: AppTheme.textDark,
                                                  ),
                                                ),
                                                if (_alreadyHaveProductIds.isNotEmpty) ...[
                                                  const SizedBox(width: 8),
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                                    decoration: BoxDecoration(
                                                      color: const Color(0xFFE0F2FE),
                                                      borderRadius: BorderRadius.circular(10),
                                                      border: Border.all(color: const Color(0xFFBAE6FD)),
                                                    ),
                                                    child: Text(
                                                      l10n.inPantryBadge(_alreadyHaveProductIds.length),
                                                      style: const TextStyle(
                                                        fontSize: 11,
                                                        fontWeight: FontWeight.w700,
                                                        color: Color(0xFF0284C7),
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ],
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              l10n.markInPantryHelp,
                                              style: const TextStyle(
                                                fontSize: 11,
                                                color: AppTheme.textMuted,
                                              ),
                                            ),
                                          ],
                                        ),
                                        Text(
                                          l10n.scaledFor(recipeProv.currentServings, recipeProv.currentServings == 1 ? l10n.person : l10n.people),
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: AppTheme.primaryGreen,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 12),

                                    // Ingredient Cards
                                    Container(
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(16),
                                        border: Border.all(color: const Color(0xFFE2E8F0)),
                                      ),
                                      child: ListView.separated(
                                        shrinkWrap: true,
                                        physics: const NeverScrollableScrollPhysics(),
                                        itemCount: recipe.ingredients.length,
                                        separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFFF1F5F9)),
                                        itemBuilder: (context, idx) {
                                          final ing = recipe.ingredients[idx];
                                          final prod = ing.product;
                                          final name = prod?.localizedName(context) ?? ing.localizedName(context);
                                          final isAlreadyHave = ing.hasLinkedProduct && _alreadyHaveProductIds.contains(ing.productId);
                                          final qtyText = ing.localizedFormattedQuantity(context);

                                          return AnimatedContainer(
                                            duration: const Duration(milliseconds: 150),
                                            color: isAlreadyHave ? const Color(0xFFF8FAFC) : Colors.transparent,
                                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                            child: Row(
                                              children: [
                                                // Icon / Image
                                                Opacity(
                                                  opacity: isAlreadyHave ? 0.6 : 1.0,
                                                  child: Container(
                                                    width: 42,
                                                    height: 42,
                                                    decoration: BoxDecoration(
                                                      color: AppTheme.mintLight,
                                                      borderRadius: BorderRadius.circular(10),
                                                    ),
                                                    clipBehavior: Clip.antiAlias,
                                                    child: prod?.imageUrl != null && prod!.imageUrl!.isNotEmpty
                                                        ? Image.network(
                                                            prod.imageUrl!,
                                                            width: 42,
                                                            height: 42,
                                                            fit: BoxFit.cover,
                                                            errorBuilder: (_, __, ___) => const Icon(
                                                              Icons.eco_rounded,
                                                              color: AppTheme.primaryGreen,
                                                              size: 22,
                                                            ),
                                                          )
                                                        : const Icon(Icons.eco_rounded, color: AppTheme.primaryGreen, size: 22),
                                                  ),
                                                ),
                                                const SizedBox(width: 12),

                                                // Ingredient Name and Notes
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                    children: [
                                                      Text(
                                                        name,
                                                        style: TextStyle(
                                                          fontWeight: FontWeight.w700,
                                                          fontSize: 14,
                                                          color: isAlreadyHave ? AppTheme.textMuted : AppTheme.textDark,
                                                          decoration: isAlreadyHave ? TextDecoration.lineThrough : null,
                                                          decorationColor: const Color(0xFF94A3B8),
                                                        ),
                                                      ),
                                                      if (ing.notes != null && ing.notes!.isNotEmpty) ...[
                                                        const SizedBox(height: 2),
                                                        Text(
                                                          ing.localizedNotes(context) ?? ing.notes!,
                                                          style: const TextStyle(
                                                            fontSize: 12,
                                                            color: AppTheme.textMuted,
                                                          ),
                                                        ),
                                                      ],
                                                    ],
                                                  ),
                                                ),

                                                // Formatted Scaled Quantity (e.g. 200 g, 250 ml, 2 pieces, 1/4 cup, 1 pound, sprinkling)
                                                if (qtyText.isNotEmpty) ...[
                                                  Container(
                                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                    decoration: BoxDecoration(
                                                      color: isAlreadyHave ? const Color(0xFFF1F5F9) : const Color(0xFFF0FDF4),
                                                      borderRadius: BorderRadius.circular(8),
                                                      border: Border.all(
                                                        color: isAlreadyHave ? const Color(0xFFE2E8F0) : const Color(0xFFBBF7D0),
                                                      ),
                                                    ),
                                                    child: Text(
                                                      qtyText,
                                                      style: TextStyle(
                                                        fontWeight: FontWeight.w800,
                                                        fontSize: 12,
                                                        color: isAlreadyHave ? AppTheme.textMuted : AppTheme.primaryDark,
                                                      ),
                                                    ),
                                                  ),
                                                ],

                                                // Pantry "I Already Have" Checkbox / Toggle (Only for catalog items)
                                                if (ing.hasLinkedProduct) ...[
                                                  const SizedBox(width: 8),
                                                  InkWell(
                                                    onTap: () {
                                                      setState(() {
                                                        if (isAlreadyHave) {
                                                          _alreadyHaveProductIds.remove(ing.productId);
                                                        } else {
                                                          _alreadyHaveProductIds.add(ing.productId);
                                                        }
                                                      });
                                                    },
                                                    borderRadius: BorderRadius.circular(8),
                                                    child: AnimatedContainer(
                                                      duration: const Duration(milliseconds: 150),
                                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                                                      decoration: BoxDecoration(
                                                        color: isAlreadyHave ? const Color(0xFFE0F2FE) : const Color(0xFFF8FAFC),
                                                        borderRadius: BorderRadius.circular(8),
                                                        border: Border.all(
                                                          color: isAlreadyHave ? const Color(0xFF0284C7) : const Color(0xFFCBD5E1),
                                                          width: isAlreadyHave ? 1.5 : 1,
                                                        ),
                                                      ),
                                                      child: Row(
                                                        mainAxisSize: MainAxisSize.min,
                                                        children: [
                                                          Icon(
                                                            isAlreadyHave ? Icons.check_box_rounded : Icons.check_box_outline_blank_rounded,
                                                            size: 16,
                                                            color: isAlreadyHave ? const Color(0xFF0284C7) : AppTheme.textMuted,
                                                          ),
                                                          const SizedBox(width: 4),
                                                          Text(
                                                            isAlreadyHave ? l10n.inPantry : l10n.iHaveThis,
                                                            style: TextStyle(
                                                              fontSize: 11,
                                                              fontWeight: isAlreadyHave ? FontWeight.bold : FontWeight.w500,
                                                              color: isAlreadyHave ? const Color(0xFF0369A1) : AppTheme.textDark,
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ],
                                            ),
                                          );
                                        },
                                      ),
                                    ),
                                    const SizedBox(height: 24),

                                    // Cooking Steps
                                    Text(
                                      l10n.preparationSteps,
                                      style: const TextStyle(
                                        fontSize: 17,
                                        fontWeight: FontWeight.w800,
                                        color: AppTheme.textDark,
                                      ),
                                    ),
                                    const SizedBox(height: 10),
                                    Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.all(16),
                                      decoration: BoxDecoration(
                                        color: Colors.white,
                                        borderRadius: BorderRadius.circular(14),
                                        border: Border.all(color: const Color(0xFFE2E8F0)),
                                      ),
                                      child: Text(
                                        recipe.localizedInstructions(context),
                                        style: const TextStyle(
                                          fontSize: 14,
                                          color: AppTheme.textDark,
                                          height: 1.6,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 30),
                                  ],
                                ),
                              ),
                            ),

                            // Sticky Quick-Commerce Bottom Action Bar
                            Builder(
                              builder: (context) {
                                final purchasableIngredients = recipe.ingredients.where((i) => i.hasLinkedProduct).toList();
                                final totalPurchasable = purchasableIngredients.length;
                                final isExternalRecipe = totalPurchasable == 0;
                                final excludedCount = _alreadyHaveProductIds.where((id) => purchasableIngredients.any((i) => i.productId == id)).length;
                                final remainingCount = totalPurchasable - excludedCount;
                                final allInPantry = totalPurchasable > 0 && remainingCount == 0;

                                return Container(
                                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withOpacity(0.08),
                                        blurRadius: 10,
                                        offset: const Offset(0, -4),
                                      ),
                                    ],
                                  ),
                                  child: SafeArea(
                                    child: SizedBox(
                                      height: 50,
                                      child: isExternalRecipe
                                          ? ElevatedButton.icon(
                                              onPressed: null,
                                              icon: const Icon(Icons.menu_book_rounded, size: 22),
                                              label: Text(
                                                '${l10n.ingredients} (${recipe.ingredients.length}) • ${l10n.smartRecipes}',
                                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                                              ),
                                              style: ElevatedButton.styleFrom(
                                                disabledBackgroundColor: const Color(0xFFE2E8F0),
                                                disabledForegroundColor: const Color(0xFF64748B),
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                              ),
                                            )
                                          : ElevatedButton.icon(
                                              onPressed: _isBundling || effectiveStoreId.isEmpty
                                                  ? null
                                                  : () => _handleBundleCart(effectiveStoreId, recipeProv.currentServings),
                                              icon: _isBundling
                                                  ? const SizedBox(
                                                      width: 20,
                                                      height: 20,
                                                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                                    )
                                                  : Icon(
                                                      allInPantry
                                                          ? Icons.check_circle_outline_rounded
                                                          : Icons.shopping_cart_checkout_rounded,
                                                      size: 22,
                                                    ),
                                              label: Text(
                                                _isBundling
                                                    ? l10n.addingToCart
                                                    : allInPantry
                                                        ? l10n.allInPantryBtn
                                                        : excludedCount > 0
                                                            ? l10n.addRemainingToCart(remainingCount)
                                                            : l10n.addAllToCart(totalPurchasable),
                                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                                              ),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: allInPantry
                                                    ? const Color(0xFF0284C7)
                                                    : AppTheme.primaryGreen,
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                              ),
                                            ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
        );
      },
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w800,
            color: AppTheme.textDark,
          ),
        ),
      ],
    );
  }
}
