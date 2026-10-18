import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../config/theme.dart';
import '../../l10n/generated/app_localizations.dart';
import '../../models/recipe_model.dart';
import '../../providers/cart_provider.dart';
import '../../providers/recipe_provider.dart';
import '../../widgets/common_widgets.dart';
import '../../utils/content_localizer.dart';
import 'cart_screen.dart';
import 'recipe_detail_screen.dart';

class RecipesScreen extends StatefulWidget {
  const RecipesScreen({super.key});

  @override
  State<RecipesScreen> createState() => _RecipesScreenState();
}

class _RecipesScreenState extends State<RecipesScreen> {
  final _searchController = TextEditingController();

  static const List<String> _cuisines = [
    'All',
    'Indian',
    'Maharashtrian',
    'Chinese',
    'Italian',
    'South Indian',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final prov = Provider.of<RecipeProvider>(context, listen: false);
      _searchController.text = prov.searchQuery;
      prov.fetchRecipes();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppTheme.warmWhite,
      appBar: AppBar(
        backgroundColor: AppTheme.warmWhite,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.creamBeigeLight,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.soup_kitchen_rounded, color: AppTheme.cocoaBrown, size: 20),
            ),
            const SizedBox(width: 10),
            Text(
              l10n.smartRecipes,
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: AppTheme.cocoaBrown),
            ),
          ],
        ),
        actions: [
          Consumer<RecipeProvider>(
            builder: (context, prov, _) {
              final hasActiveFilters = prov.searchQuery.isNotEmpty ||
                  prov.dietaryFilter != 'ALL' ||
                  prov.selectedCuisine != 'All';
              if (!hasActiveFilters) return const SizedBox.shrink();
              return TextButton.icon(
                onPressed: () {
                  _searchController.clear();
                  prov.resetFilters();
                },
                icon: const Icon(Icons.refresh_rounded, size: 16, color: AppTheme.spiceOrange),
                label: Text(
                  l10n.retry,
                  style: const TextStyle(color: AppTheme.spiceOrange, fontWeight: FontWeight.bold, fontSize: 13),
                ),
              );
            },
          ),
          Consumer<CartProvider>(
            builder: (context, cartProv, _) {
              return IconButton(
                tooltip: l10n.navCart,
                icon: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    const Icon(Icons.shopping_bag_outlined, color: AppTheme.cocoaBrown),
                    if (cartProv.itemCount > 0)
                      Positioned(
                        right: -4,
                        top: -4,
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(
                            color: AppTheme.spiceOrange,
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
              );
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Consumer<RecipeProvider>(
        builder: (context, recipeProv, child) {
          return RefreshIndicator(
            onRefresh: () => recipeProv.fetchRecipes(),
            color: AppTheme.spiceOrange,
            child: Column(
              children: [
                // Top Search & Filters Section
                Container(
                  color: AppTheme.warmWhite,
                  padding: const EdgeInsets.fromLTRB(16, 6, 16, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Search Bar
                      Container(
                        height: 44,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.cardBorder),
                        ),
                        child: TextField(
                          controller: _searchController,
                          onChanged: (val) => recipeProv.setSearchQuery(val),
                          style: const TextStyle(fontSize: 14, color: AppTheme.cocoaBrown),
                          decoration: InputDecoration(
                            hintText: l10n.searchRecipesHint,
                            hintStyle: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                            prefixIcon: const Icon(Icons.search, size: 20, color: AppTheme.cocoaBrownLight),
                            suffixIcon: _searchController.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.cancel, size: 18, color: AppTheme.textMuted),
                                    onPressed: () {
                                      _searchController.clear();
                                      recipeProv.setSearchQuery('');
                                    },
                                  )
                                : null,
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Cuisine Filter Chips (Horizontal Scroll)
                      SizedBox(
                        height: 34,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: _cuisines.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (context, idx) {
                            final cuisine = _cuisines[idx];
                            final isSelected = recipeProv.selectedCuisine.toLowerCase() == cuisine.toLowerCase();
                            final displayCuisine = cuisine == 'All'
                                ? l10n.allCuisines
                                : ContentLocalizer.recipeCuisine(
                                    cuisine, Localizations.localeOf(context).languageCode);
                            return ChoiceChip(
                              label: Text(displayCuisine),
                              selected: isSelected,
                              showCheckmark: false,
                              selectedColor: AppTheme.oliveGreen,
                              backgroundColor: AppTheme.creamBeigeSoft,
                              labelStyle: TextStyle(
                                color: isSelected ? Colors.white : AppTheme.cocoaBrown,
                                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                fontSize: 12,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                                side: BorderSide(
                                  color: isSelected ? AppTheme.oliveGreen : AppTheme.cardBorder,
                                ),
                              ),
                              onSelected: (_) => recipeProv.setCuisineFilter(cuisine),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Dietary Filter Chips (All, Veg, Non-Veg)
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            _buildDietaryChip(
                              label: l10n.allDifficulties,
                              isSelected: recipeProv.dietaryFilter == 'ALL',
                              onTap: () => recipeProv.setDietaryFilter('ALL'),
                            ),
                            const SizedBox(width: 8),
                            _buildDietaryChip(
                              label: l10n.dietaryVeg,
                              icon: Icons.eco_rounded,
                              iconColor: AppTheme.oliveGreen,
                              isSelected: recipeProv.dietaryFilter == 'VEG',
                              onTap: () => recipeProv.setDietaryFilter('VEG'),
                            ),
                            const SizedBox(width: 8),
                            _buildDietaryChip(
                              label: l10n.dietaryNonVeg,
                              icon: Icons.restaurant,
                              iconColor: const Color(0xFFB91C1C),
                              isSelected: recipeProv.dietaryFilter == 'NON_VEG',
                              onTap: () => recipeProv.setDietaryFilter('NON_VEG'),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                // Recipe Count & Results Header
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          '${recipeProv.recipes.length} ${recipeProv.recipes.length == 1 ? 'Recipe' : 'Recipes'} Available',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.cocoaBrown,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (recipeProv.selectedCuisine != 'All')
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppTheme.creamBeigeLight,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppTheme.cardBorder),
                          ),
                          child: Text(
                            recipeProv.selectedCuisine,
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.cocoaBrown,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),

                // Recipe List
                Expanded(
                  child: recipeProv.isLoading
                      ? LoadingView(message: l10n.loading)
                      : recipeProv.errorMessage != null && recipeProv.recipes.isEmpty
                          ? ErrorStateView(
                              message: recipeProv.errorMessage!,
                              title: l10n.somethingWentWrong,
                              retryLabel: l10n.retry,
                              onRetry: () => recipeProv.fetchRecipes(),
                            )
                          : recipeProv.recipes.isEmpty
                              ? Center(
                                  child: Padding(
                                    padding: const EdgeInsets.all(24),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.all(18),
                                          decoration: BoxDecoration(
                                            color: AppTheme.creamBeigeLight,
                                            shape: BoxShape.circle,
                                            border: Border.all(color: AppTheme.creamBeige, width: 2),
                                          ),
                                          child: const Icon(
                                            Icons.soup_kitchen_outlined,
                                            size: 44,
                                            color: AppTheme.cocoaBrown,
                                          ),
                                        ),
                                        const SizedBox(height: 16),
                                        Text(
                                          l10n.noRecipesFound,
                                          style: const TextStyle(
                                            fontSize: 17,
                                            fontWeight: FontWeight.w800,
                                            color: AppTheme.cocoaBrown,
                                          ),
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          l10n.somethingWentWrong,
                                          textAlign: TextAlign.center,
                                          style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                                        ),
                                        const SizedBox(height: 16),
                                        ElevatedButton.icon(
                                          onPressed: () {
                                            _searchController.clear();
                                            recipeProv.resetFilters();
                                          },
                                          icon: const Icon(Icons.refresh, size: 18),
                                          label: Text(l10n.retry),
                                        ),
                                      ],
                                    ),
                                  ),
                                )
                              : Builder(
                                  builder: (context) {
                                    final categories = _getCategoriesToShow(recipeProv);
                                    if (categories.isEmpty) {
                                      return const Center(
                                        child: Text(
                                          'No recipe categories found for current filters.',
                                          style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
                                        ),
                                      );
                                    }
                                    return ListView.separated(
                                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 90),
                                      itemCount: categories.length,
                                      separatorBuilder: (_, __) => const SizedBox(height: 24),
                                      itemBuilder: (context, index) {
                                        final category = categories[index];
                                        final categoryRecipes = recipeProv.recipes
                                            .where((r) => r.cuisine.toLowerCase() == category.toLowerCase())
                                            .take(2)
                                            .toList();

                                        if (categoryRecipes.isEmpty) return const SizedBox.shrink();

                                        return _buildCategorySection(context, category, categoryRecipes);
                                      },
                                    );
                                  },
                                ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildDietaryChip({
    required String label,
    IconData? icon,
    Color? iconColor,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.creamBeigeLight : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppTheme.oliveGreen : AppTheme.cardBorder,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 14, color: iconColor),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? AppTheme.cocoaBrown : AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<String> _getCategoriesToShow(RecipeProvider recipeProv) {
    if (recipeProv.selectedCuisine != 'All') {
      return [recipeProv.selectedCuisine];
    }
    const standardCategories = [
      'Indian',
      'Maharashtrian',
      'Chinese',
      'Italian',
      'South Indian',
    ];
    final available = recipeProv.recipes
        .map((r) => r.cuisine.trim())
        .where((c) => c.isNotEmpty)
        .toSet();
    final categories = <String>[];
    for (final c in standardCategories) {
      if (available.any((a) => a.toLowerCase() == c.toLowerCase())) {
        categories.add(c);
      }
    }
    for (final a in available) {
      if (!categories.any((c) => c.toLowerCase() == a.toLowerCase())) {
        categories.add(a);
      }
    }
    return categories;
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'indian':
        return Icons.local_dining_rounded;
      case 'maharashtrian':
        return Icons.whatshot_rounded;
      case 'chinese':
        return Icons.ramen_dining_rounded;
      case 'italian':
        return Icons.local_pizza_rounded;
      case 'south indian':
        return Icons.rice_bowl_rounded;
      default:
        return Icons.soup_kitchen_rounded;
    }
  }

  Widget _buildCategorySection(
    BuildContext context,
    String category,
    List<RecipeModel> recipes,
  ) {
    final l10n = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Category Header Row
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: AppTheme.creamBeigeLight,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppTheme.cardBorder),
                    ),
                    child: Icon(
                      _getCategoryIcon(category),
                      size: 16,
                      color: AppTheme.cocoaBrown,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '${ContentLocalizer.recipeCuisine(category, Localizations.localeOf(context).languageCode)} ${l10n.navRecipes}',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.cocoaBrown,
                        letterSpacing: -0.2,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppTheme.creamBeigeSoft,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.cardBorder),
              ),
              child: Text(
                '${recipes.length} ${recipes.length == 1 ? 'Dish' : 'Dishes'}',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textMuted,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),

        // 2 Recipe Images in Category - Identical Dimensions & Responsive
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: _buildRecipeGridCard(context, recipes[0]),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: recipes.length > 1
                  ? _buildRecipeGridCard(context, recipes[1])
                  : const SizedBox.shrink(),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildRecipeGridCard(BuildContext context, RecipeModel recipe) {
    return RecipeGridCard(recipe: recipe);
  }
}

class RecipeGridCard extends StatelessWidget {
  final RecipeModel recipe;
  final VoidCallback? onTap;

  const RecipeGridCard({
    super.key,
    required this.recipe,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final title = recipe.localizedTitle(context);
    return InkWell(
      onTap: onTap ??
          () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => RecipeDetailScreen(recipeId: recipe.id),
              ),
            );
          },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.warmWhite,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.cardBorder),
          boxShadow: [
            BoxShadow(
              color: AppTheme.cocoaBrown.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Recipe Image Container with uniform 16:11 AspectRatio
            SizedBox(
              width: double.infinity,
              child: AspectRatio(
                aspectRatio: 16 / 11,
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Container(
                      width: double.infinity,
                      height: double.infinity,
                      color: AppTheme.creamBeigeSoft,
                      child: recipe.imageUrl != null && recipe.imageUrl!.isNotEmpty
                          ? Image.network(
                              recipe.imageUrl!,
                              width: double.infinity,
                              height: double.infinity,
                              fit: BoxFit.cover,
                              loadingBuilder: (context, child, loadingProgress) {
                                if (loadingProgress == null) return child;
                                return _buildPlaceholder(isLoading: true);
                              },
                              errorBuilder: (_, __, ___) => _buildPlaceholder(recipeTitle: title),
                            )
                          : _buildPlaceholder(recipeTitle: title),
                    ),
                    // Gradient Overlay
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black.withOpacity(0.08),
                              Colors.transparent,
                              Colors.black.withOpacity(0.65),
                            ],
                          ),
                        ),
                      ),
                    ),
                    // Dietary Badge
                    Positioned(
                      top: 8,
                      left: 8,
                      child: StatusBadge.fromDietaryType(recipe.dietaryType),
                    ),
                    // Time Pill
                    Positioned(
                      bottom: 8,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.cocoaBrownDark.withOpacity(0.8),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.timer_outlined, size: 10, color: Colors.white),
                            const SizedBox(width: 3),
                            Text(
                              '${recipe.totalTimeMinutes}m',
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    // Difficulty Badge
                    Positioned(
                      bottom: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppTheme.warmWhite.withOpacity(0.92),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          recipe.difficulty,
                          style: const TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w800,
                            color: AppTheme.cocoaBrown,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Recipe Card Content: Title, Servings, and Items count
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Uniform title container height
                  SizedBox(
                    height: 36,
                    child: Text(
                      title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: AppTheme.cocoaBrown,
                        height: 1.25,
                      ),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.group_outlined, size: 12, color: AppTheme.textMuted),
                            const SizedBox(width: 3),
                            Flexible(
                              child: Text(
                                '${recipe.servings} ${l10n.servings}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  color: AppTheme.textMuted,
                                  fontWeight: FontWeight.w600,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.shopping_basket_outlined, size: 12, color: AppTheme.oliveGreen),
                            const SizedBox(width: 3),
                            Flexible(
                              child: Text(
                                '${recipe.ingredients.length} ${l10n.items}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: AppTheme.oliveGreen,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholder({bool isLoading = false, String? recipeTitle}) {
    return Container(
      color: AppTheme.creamBeigeSoft,
      child: Center(
        child: isLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: AppTheme.spiceOrange,
                ),
              )
            : Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.restaurant_menu_rounded,
                    size: 38,
                    color: AppTheme.creamBeige,
                  ),
                  if (recipeTitle != null && recipeTitle.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: Text(
                        recipeTitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textMuted,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
      ),
    );
  }
}
