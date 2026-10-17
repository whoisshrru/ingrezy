import 'package:flutter/material.dart';
import '../models/recipe_model.dart';
import '../services/recipe_service.dart';

class RecipeProvider extends ChangeNotifier {
  List<RecipeModel> _recipes = [];
  RecipeModel? _selectedRecipe;
  int _currentServings = 2;
  String _searchQuery = '';
  String _dietaryFilter = 'ALL'; // 'ALL', 'VEG', 'NON_VEG'
  String _selectedCuisine = 'All'; // 'All', 'Indian', 'Maharashtrian', 'Chinese', 'Italian', 'South Indian'
  bool _isLoading = false;
  String? _errorMessage;

  List<RecipeModel> get recipes => _recipes;
  RecipeModel? get selectedRecipe => _selectedRecipe;
  int get currentServings => _currentServings;
  String get searchQuery => _searchQuery;
  String get dietaryFilter => _dietaryFilter;
  String get selectedCuisine => _selectedCuisine;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  Future<void> fetchRecipes() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final response = await RecipeService.getRecipes(
      search: _searchQuery,
      dietaryType: _dietaryFilter,
      cuisine: _selectedCuisine,
    );

    _isLoading = false;
    if (response.isSuccess && response.data != null) {
      _recipes = response.data!;
      _errorMessage = null;
    } else {
      _errorMessage = response.message;
    }
    notifyListeners();
  }

  Future<void> fetchRecipeDetails(String recipeId, {int? servings}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final targetServings = servings ?? _currentServings;
    final response = await RecipeService.getRecipeById(
      recipeId,
      servings: targetServings,
    );

    _isLoading = false;
    if (response.isSuccess && response.data != null) {
      _selectedRecipe = response.data;
      _currentServings = _selectedRecipe!.servings;
      _errorMessage = null;
    } else {
      _errorMessage = response.message;
    }
    notifyListeners();
  }

  void updateServings(int newServings) {
    if (newServings < 1 || _selectedRecipe == null) return;
    _currentServings = newServings;

    // Immediately update in-memory recipe for instantaneous UI recalculation
    _selectedRecipe = _selectedRecipe!.withServings(newServings);
    notifyListeners();

    // Background sync with server calculation
    RecipeService.getRecipeById(_selectedRecipe!.id, servings: newServings).then((res) {
      if (res.isSuccess && res.data != null && _selectedRecipe?.id == res.data!.id) {
        _selectedRecipe = res.data;
        notifyListeners();
      }
    });
  }

  void setCuisineFilter(String cuisine) {
    if (_selectedCuisine == cuisine) return;
    _selectedCuisine = cuisine;
    fetchRecipes();
  }

  void setDietaryFilter(String dietary) {
    if (_dietaryFilter == dietary) return;
    _dietaryFilter = dietary;
    fetchRecipes();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    fetchRecipes();
  }

  void resetFilters() {
    _searchQuery = '';
    _dietaryFilter = 'ALL';
    _selectedCuisine = 'All';
    fetchRecipes();
  }
}
