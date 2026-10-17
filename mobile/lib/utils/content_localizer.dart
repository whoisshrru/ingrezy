import 'package:flutter/material.dart';
import '../models/product_model.dart';
import '../models/recipe_model.dart';

/// Comprehensive multi-language content localizer for dynamic backend catalog,
/// recipes, ingredients, units, quantities, and instructions.
class ContentLocalizer {
  static const Map<String, String> _devanagariDigits = {
    '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
    '5': '५', '6': '६', '7': '७', '8': '८', '9': '९',
  };

  /// Converts Latin digits to Devanagari numerals
  static String formatDigits(String text, String localeCode) {
    if (localeCode != 'mr' && localeCode != 'hi') return text;
    var out = text;
    _devanagariDigits.forEach((lat, dev) {
      out = out.replaceAll(lat, dev);
    });
    return out;
  }

  // ==========================================
  // PRODUCT NAMES
  // ==========================================
  static final Map<String, Map<String, String>> _productNameMap = {
    'farm fresh onions': {
      'mr': 'ताजे कांदे',
      'hi': 'ताजा प्याज',
    },
    'fresh red tomatoes': {
      'mr': 'ताजे लाल टोमॅटो',
      'hi': 'ताजा लाल टमाटर',
    },
    'farm fresh tomatoes': {
      'mr': 'ताजे लाल टोमॅटो',
      'hi': 'ताजा लाल टमाटर',
    },
    'hybrid tomatoes': {
      'mr': 'हायब्रिड टोमॅटो',
      'hi': 'हाइब्रिड टमाटर',
    },
    'fresh chicken curry cut': {
      'mr': 'ताजे चिकन करी कट',
      'hi': 'ताजा चिकन करी कट',
    },
    'amul table butter': {
      'mr': 'अमुल टेबल बटर',
      'hi': 'अमूल टेबल बटर',
    },
    'table butter': {
      'mr': 'टेबल बटर',
      'hi': 'टेबल बटर',
    },
    'fresh ladi pav bread': {
      'mr': 'ताजा लादी पाव',
      'hi': 'ताजा लादी पाव',
    },
    'veg hakka noodles': {
      'mr': 'व्हेज हक्का नूडल्स',
      'hi': 'वेज हक्का नूडल्स',
    },
    'durum wheat penne pasta': {
      'mr': 'डुरम व्हीट पेने पास्ता',
      'hi': 'डुरम व्हीट पेने पास्ता',
    },
    'sona masoori rice': {
      'mr': 'सोना मसुरी तांदूळ',
      'hi': 'सोना मसूरी चावल',
    },
    'cow milk': {
      'mr': 'गायीचे दूध',
      'hi': 'गाय का दूध',
    },
    'fresh malai paneer': {
      'mr': 'ताजे मलाई पनीर',
      'hi': 'ताजा मलाई पनीर',
    },
    'organic mangoes': {
      'mr': 'सेंद्रिय आंबे',
      'hi': 'जैविक आम',
    },
    'shimla apples': {
      'mr': 'शिमला सफरचंद',
      'hi': 'शिमला सेब',
    },
    'rare cheese': {
      'mr': 'चीझ',
      'hi': 'चीज',
    },
    'brown bread': {
      'mr': 'ब्राउन ब्रेड',
      'hi': 'ब्राउन ब्रेड',
    },
  };

  /// Translates product name according to locale
  static String productName(String rawName, String localeCode) {
    if (localeCode == 'en') return rawName;

    final lower = rawName.trim().toLowerCase();
    // Direct match
    if (_productNameMap.containsKey(lower)) {
      return _productNameMap[lower]![localeCode] ?? rawName;
    }

    // Keyword & prefix matching (stripping store trailing numbers like "Cow Milk 104519")
    for (final entry in _productNameMap.entries) {
      if (lower.startsWith(entry.key) || lower.contains(entry.key)) {
        return entry.value[localeCode] ?? rawName;
      }
    }

    // Generic fallback terms
    if (lower.contains('tomato')) {
      return localeCode == 'mr' ? 'टोमॅटो' : 'टमाटर';
    }
    if (lower.contains('onion')) {
      return localeCode == 'mr' ? 'कांदा' : 'प्याज';
    }
    if (lower.contains('chicken')) {
      return 'चिकन';
    }
    if (lower.contains('milk')) {
      return localeCode == 'mr' ? 'दूध' : 'दूध';
    }
    if (lower.contains('paneer')) {
      return 'पनीर';
    }
    if (lower.contains('butter')) {
      return localeCode == 'mr' ? 'बटर' : 'मक्खन';
    }
    if (lower.contains('rice')) {
      return localeCode == 'mr' ? 'तांदूळ' : 'चावल';
    }
    if (lower.contains('noodle')) {
      return 'नूडल्स';
    }
    if (lower.contains('pasta')) {
      return 'पास्ता';
    }
    if (lower.contains('bread') || lower.contains('pav')) {
      return localeCode == 'mr' ? 'पाव / ब्रेड' : 'पाव / ब्रेड';
    }
    if (lower.contains('apple')) {
      return localeCode == 'mr' ? 'सफरचंद' : 'सेब';
    }
    if (lower.contains('mango')) {
      return localeCode == 'mr' ? 'आंबा' : 'आम';
    }
    if (lower.contains('cheese')) {
      return localeCode == 'mr' ? 'चीझ' : 'चीज';
    }

    return rawName;
  }

  static String? productDescription(String? rawDesc, String localeCode) {
    if (rawDesc == null || rawDesc.isEmpty || localeCode == 'en') return rawDesc;
    return formatDigits(rawDesc, localeCode);
  }

  // ==========================================
  // UNITS & QUANTITIES
  // ==========================================
  static final Map<String, Map<String, String>> _unitMap = {
    '1kg': {'mr': '१ किलो', 'hi': '१ किग्रा'},
    '1kg pack': {'mr': '१ किलो पॅक', 'hi': '१ किग्रा पैक'},
    '1kg box': {'mr': '१ किलो बॉक्स', 'hi': '१ किग्रा बॉक्स'},
    '500g': {'mr': '५०० ग्रॅम', 'hi': '५०० ग्राम'},
    '500g tray': {'mr': '५०० ग्रॅम ट्रे', 'hi': '५०० ग्राम ट्रे'},
    '500g box': {'mr': '५०० ग्रॅम बॉक्स', 'hi': '५०० ग्राम बॉक्स'},
    '200g': {'mr': '२०० ग्रॅम', 'hi': '२०० ग्राम'},
    '200g pack': {'mr': '२०० ग्रॅम पॅक', 'hi': '२०० ग्राम पैक'},
    '300g pack': {'mr': '३०० ग्रॅम पॅक', 'hi': '३०० ग्राम पैक'},
    '400g loaf': {'mr': '४०० ग्रॅम लोफ', 'hi': '४०० ग्राम लोफ'},
    '500ml': {'mr': '५०० मिली', 'hi': '५०० मिली'},
    '500ml pouch': {'mr': '५०० मिली पाऊच', 'hi': '५०० मिली पाउच'},
    'pack of 6': {'mr': '६ चा पॅक', 'hi': '६ का पैक'},
    'pieces': {'mr': 'नग', 'hi': 'नग'},
    'piece': {'mr': 'नग', 'hi': 'नग'},
    'pcs': {'mr': 'नग', 'hi': 'नग'},
    'g': {'mr': 'ग्रॅम', 'hi': 'ग्राम'},
    'kg': {'mr': 'किलो', 'hi': 'किग्रा'},
    'ml': {'mr': 'मिली', 'hi': 'मिली'},
    'l': {'mr': 'लिटर', 'hi': 'लीटर'},
  };

  /// Translates product packaging/unit strings
  static String unit(String rawUnit, String localeCode) {
    if (localeCode == 'en') return rawUnit;
    final lower = rawUnit.trim().toLowerCase();

    if (_unitMap.containsKey(lower)) {
      return _unitMap[lower]![localeCode] ?? rawUnit;
    }

    var result = rawUnit;
    if (localeCode == 'mr') {
      result = result
          .replaceAll(RegExp(r'\btray\b', caseSensitive: false), 'ट्रे')
          .replaceAll(RegExp(r'\bpack of (\d+)\b', caseSensitive: false), r'$1 चा पॅक')
          .replaceAll(RegExp(r'\bpack\b', caseSensitive: false), 'पॅक')
          .replaceAll(RegExp(r'\bbox\b', caseSensitive: false), 'बॉक्स')
          .replaceAll(RegExp(r'\bloaf\b', caseSensitive: false), 'लोफ')
          .replaceAll(RegExp(r'\bpouch\b', caseSensitive: false), 'पाऊच')
          .replaceAll(RegExp(r'\bpieces?\b', caseSensitive: false), 'नग')
          .replaceAll(RegExp(r'\bpcs\b', caseSensitive: false), 'नग')
          .replaceAll(RegExp(r'(\d+)\s*kg\b', caseSensitive: false), r'$1 किलो')
          .replaceAll(RegExp(r'(\d+)\s*g\b', caseSensitive: false), r'$1 ग्रॅम')
          .replaceAll(RegExp(r'(\d+)\s*ml\b', caseSensitive: false), r'$1 मिली');
    } else if (localeCode == 'hi') {
      result = result
          .replaceAll(RegExp(r'\btray\b', caseSensitive: false), 'ट्रे')
          .replaceAll(RegExp(r'\bpack of (\d+)\b', caseSensitive: false), r'$1 का पैक')
          .replaceAll(RegExp(r'\bpack\b', caseSensitive: false), 'पैक')
          .replaceAll(RegExp(r'\bbox\b', caseSensitive: false), 'बॉक्स')
          .replaceAll(RegExp(r'\bloaf\b', caseSensitive: false), 'लोफ')
          .replaceAll(RegExp(r'\bpouch\b', caseSensitive: false), 'पाउच')
          .replaceAll(RegExp(r'\bpieces?\b', caseSensitive: false), 'नग')
          .replaceAll(RegExp(r'\bpcs\b', caseSensitive: false), 'नग')
          .replaceAll(RegExp(r'(\d+)\s*kg\b', caseSensitive: false), r'$1 किग्रा')
          .replaceAll(RegExp(r'(\d+)\s*g\b', caseSensitive: false), r'$1 ग्राम')
          .replaceAll(RegExp(r'(\d+)\s*ml\b', caseSensitive: false), r'$1 मिली');
    }

    return formatDigits(result, localeCode);
  }

  // ==========================================
  // RECIPES (TITLES, CUISINES, DESCRIPTIONS)
  // ==========================================
  static final Map<String, Map<String, String>> _recipeTitleMap = {
    'paneer butter masala': {
      'mr': 'पनीर बटर मसाला',
      'hi': 'पनीर बटर मसाला',
    },
    'kolhapuri chicken rassa': {
      'mr': 'कोल्हापुरी चिकन रस्सा',
      'hi': 'कोल्हापुरी चिकन रस्सा',
    },
    'creamy tomato basil penne': {
      'mr': 'क्रीमी टोमॅटो बेसिल पेने',
      'hi': 'क्रीमी टोमैटो बेसिल पेने',
    },
    'shahi chicken biryani': {
      'mr': 'शाही चिकन बिर्याणी',
      'hi': 'शाही चिकन बिरयानी',
    },
    'kolhapuri misal pav': {
      'mr': 'कोल्हापुरी मिसळ पाव',
      'hi': 'कोल्हापुरी मिसल पाव',
    },
    'desi veg hakka noodles': {
      'mr': 'देसी व्हेज हक्का नूडल्स',
      'hi': 'देसी वेज हक्का नूडल्स',
    },
    'indo-chinese chilli chicken': {
      'mr': 'इंडो-चायनीज चिली चिकन',
      'hi': 'इंडो-चाइनीज चिली चिकन',
    },
    'classic margherita pizza': {
      'mr': 'क्लासिक मार्गेरिटा पिझ्झा',
      'hi': 'क्लासिक मार्गेरिटा पिज़्ज़ा',
    },
    'classic south indian masala dosa': {
      'mr': 'क्लासिक दाक्षिणात्य मसाला डोसा',
      'hi': 'क्लासिक दक्षिण भारतीय मसाला डोसा',
    },
    'steamed idli sambar platter': {
      'mr': 'इडली सांबार प्लॅटर',
      'hi': 'इडली सांभर प्लैटर',
    },
  };

  static String recipeTitle(String rawTitle, String localeCode) {
    if (localeCode == 'en') return rawTitle;
    final lower = rawTitle.trim().toLowerCase();
    if (_recipeTitleMap.containsKey(lower)) {
      return _recipeTitleMap[lower]![localeCode] ?? rawTitle;
    }
    for (final entry in _recipeTitleMap.entries) {
      if (lower.contains(entry.key)) {
        return entry.value[localeCode] ?? rawTitle;
      }
    }
    return rawTitle;
  }

  static String recipeCuisine(String cuisine, String localeCode) {
    if (localeCode == 'en') return cuisine;
    final lower = cuisine.trim().toLowerCase();
    switch (lower) {
      case 'south indian':
        return localeCode == 'mr' ? 'दाक्षिणात्य' : 'दक्षिण भारतीय';
      case 'italian':
        return 'इटालियन';
      case 'chinese':
        return localeCode == 'mr' ? 'चायनीज' : 'चाइनीज';
      case 'maharashtrian':
        return 'महाराष्ट्रीयन';
      case 'indian':
        return 'भारतीय';
      default:
        return cuisine;
    }
  }

  static final Map<String, Map<String, String>> _recipeDescriptionMap = {
    'paneer butter masala': {
      'mr': 'मखमली टोमॅटो-बटर ग्रेव्हीमध्ये बनवलेली समृद्ध आणि क्रीमी कॉटेज चीज (पनीर) करी.',
      'hi': 'मखमली टमाटर-मक्खन की ग्रेवी में बनी समृद्ध और मलाईदार पनीर करी।',
    },
    'kolhapuri chicken rassa': {
      'mr': 'रसदार हाडांच्या चिकनने बनवलेला अस्सल झणझणीत कोल्हापुरी तांबडा रस्सा.',
      'hi': 'रसीले चिकन के साथ बनी प्रामाणिक तीखी कोल्हापुरी लाल रस्सा करी।',
    },
    'creamy tomato basil penne': {
      'mr': 'क्रश केलेल्या ताज्या टोमॅटो आणि क्रीमच्या रोझ सॉसमध्ये बनवलेला अल डेंटे पेने पास्ता.',
      'hi': 'कुचले हुए लाल टमाटर और मलाई के सॉस में बना स्वादिष्ट पेने पास्ता।',
    },
    'shahi chicken biryani': {
      'mr': 'मसालेदार मॅरीनेट केलेले चिकन आणि तळलेल्या कांद्यासह सुगंधित बासमती तांदळाची शाही बिर्याणी.',
      'hi': 'मसालेदार मैरीनेटेड चिकन और तले हुए प्याज के साथ सुगंधित बासमती चावल की लेयर्ड बिरयानी।',
    },
    'kolhapuri misal pav': {
      'mr': 'ताजा लादी पाव, कांदा आणि लिंबासोबत सर्व्ह केलेली झणझणीत मोड आलेल्या मटकीची उसळ आणि रस्सा.',
      'hi': 'ताजा लादी पाव, प्याज और नींबू के साथ परोसी जाने वाली तीखी अंकुरित मोठ की मिसल।',
    },
    'desi veg hakka noodles': {
      'mr': 'बारीक चिरलेल्या ताज्या भाज्या आणि चवदार इंडो-चायनीज सॉससह वॉक-टॉस केलेल्या नूडल्स.',
      'hi': 'बारीक कटी सब्जियों और चटपटे इंडो-चाइनीज सॉस के साथ वॉक में पकाई गई स्वादिष्ट नूडल्स।',
    },
    'indo-chinese chilli chicken': {
      'mr': 'कुरकुरीत तळलेले चिकनचे तुकडे, सिमला मिरची, कांदा आणि तिखट चिली गार्लिक सॉससह टॉस केलेले.',
      'hi': 'कुरकुरे तले हुए चिकन के टुकड़े, शिमला मिर्च, प्याज और तीखी चिली गार्लिक ग्रेवी के साथ।',
    },
    'classic margherita pizza': {
      'mr': 'घरगुती टोमॅटो सॉस, वितळलेले मोझरेला चीज आणि ताज्या तुळशीच्या पानांनी सजवलेला कुरकुरीत पिझ्झा.',
      'hi': 'घर के बने टमाटर सॉस, पिघले हुए मोज़ेरेला चीज़ और ताजी तुलसी से बना क्रिस्पी पिज़्ज़ा।',
    },
    'classic south indian masala dosa': {
      'mr': 'मसालेदार बटाट्याची भाजी भरलेला कुरकुरीत सोनेरी डोसा, टोमॅटो चटणीसोबत सर्व्ह केलेला.',
      'hi': 'मसालेदार आलू के भरावन के साथ कुरकुरा सुनहरा डोसा, टमाटर की चटनी के साथ परोसा गया।',
    },
    'steamed idli sambar platter': {
      'mr': 'सुगंधित भाजी सांबार आणि ताज्या नारळाच्या चटणीसह मऊ लुसलुशीत वाफवलेली इडली.',
      'hi': 'सुगंधित सांभर और ताजी नारियल की चटनी के साथ परोसी जाने वाली फूली हुई इडली।',
    },
  };

  static String recipeDescription(String? rawDesc, String localeCode, {String? recipeTitle}) {
    if (rawDesc == null || rawDesc.isEmpty || localeCode == 'en') return rawDesc ?? '';

    // Check title-based mapping
    if (recipeTitle != null) {
      final titleKey = recipeTitle.trim().toLowerCase();
      for (final entry in _recipeDescriptionMap.entries) {
        if (titleKey.contains(entry.key)) {
          return entry.value[localeCode] ?? rawDesc;
        }
      }
    }

    // Check description text match
    final lower = rawDesc.trim().toLowerCase();
    for (final entry in _recipeDescriptionMap.entries) {
      if (lower.contains(entry.key) || lower.startsWith(entry.key.substring(0, 5))) {
        return entry.value[localeCode] ?? rawDesc;
      }
    }

    return rawDesc;
  }

  // ==========================================
  // RECIPE INSTRUCTIONS
  // ==========================================
  static final Map<String, Map<String, String>> _recipeInstructionsMap = {
    'paneer butter masala': {
      'mr': '१. पॅनमध्ये बटर गरम करा. २. बारीक चिरलेला कांदा आणि टोमॅटो परतून घ्या. ३. मिक्सरमध्ये मऊ प्युरी बनवा. ४. पनीरचे तुकडे आणि दुधाची साय/क्रीम घालून मंद आचेवर शिजवा. ५. कसुरी मेथी घालून सजवा.',
      'hi': '१. पैन में मक्खन गर्म करें। २. कटे हुए प्याज और टमाटर भूनें। ३. चिकनी प्यूरी बना लें। ४. पनीर के टुकड़े और क्रीम डालकर धीमी आंच पर पकाएं। ५. कसूरी मेथी से सजाकर परोसें।',
    },
    'kolhapuri chicken rassa': {
      'mr': '१. सुके खोबरे, कांदा आणि कोल्हापुरी मसाला भाजून घ्या. २. चिकनचे तुकडे चांगले परता. ३. गरम पाणी घालून चिकन मऊ होईपर्यंत मंद आचेवर शिजवा. ४. गरम पाव किंवा भातासोबत सर्व्ह करा.',
      'hi': '१. सूखा नारियल, प्याज और कोल्हापुरी मसाला भूनें। २. चिकन के टुकड़ों को अच्छी तरह भूनें। ३. गर्म पानी डालें और चिकन पकने तक धीमी आंच पर उबालें। ४. पाव या चावल के साथ गरमा-गर्म परोसें।',
    },
    'creamy tomato basil penne': {
      'mr': '१. मिठाच्या पाण्यात पेने पास्ता अल डेंटे होईपर्यंत उकळा. २. बटरमध्ये क्रश केलेले ताजे टोमॅटो शिजवा. ३. दूध/क्रीम आणि तुळशीची पाने घाला. ४. पास्ता सॉसमध्ये एकत्र करून २ मिनिटे मंद आचेवर शिजवा.',
      'hi': '१. नमक वाले पानी में पास्ता को उबालें। २. मक्खन में कुचले हुए ताजे टमाटर पकाएं। ३. दूध/मलाई और तुलसी की पत्तियां मिलाएं। ४. पास्ता और सॉस को मिलाकर २ मिनट पकाएं।',
    },
    'shahi chicken biryani': {
      'mr': '१. ताजे चिकन दही आणि मसाल्यांमध्ये मॅरीनेट करा. २. खड्या मसाल्यांसह तांदूळ अर्धा उकळून घ्या. ३. जाड बुडाच्या हंडीत चिकन आणि भाताचे थर लावा. ४. मंद आचेवर २५ मिनिटे दम द्या.',
      'hi': '१. ताजे चिकन को दही और मसालों के साथ मैरीनेट करें। २. खड़े मसालों के साथ चावल आधा पकाएं। ३. भारी हांडी में चिकन और चावल की परतें लगाएं। ४. २५ मिनट के लिए दम पर पकाएं।',
    },
    'kolhapuri misal pav': {
      'mr': '१. मोड आलेली मटकी शिजवून घ्या. २. कांदा-टोमॅटो वाटणासह झणझणीत कट/रस्सा तयार करा. ३. फरसाण, कच्चा कांदा आणि कोथिंबीर वरून घाला. ४. ताज्या लादी पावासोबत गरमागरम सर्व्ह करा.',
      'hi': '१. अंकुरित मटकी पकाएं। २. प्याज-टमाटर के पेस्ट से तीखा रस्सा तैयार करें। ३. फरसाण, कच्चा प्याज और हरा धनिया डालें। ४. ताजे लादी पाव के साथ गरमा-गरम परोसें।',
    },
    'desi veg hakka noodles': {
      'mr': '१. नूडल्स उकळून चाळणीत पाणी काढून घ्या. २. वॉक किंवा कढईत मोठ्या आचेवर कांदा आणि भाज्या परता. ३. नूडल्स, सोया सॉस आणि चिली सॉस घाला. ४. ३ मिनिटे चांगले स्टिर-फ्राय करा.',
      'hi': '१. नूडल्स उबालें और छान लें। २. तेज आंच पर प्याज और सब्जियां भूनें। ३. नूडल्स, सोया सॉस और चिली सॉस डालें। ४. ३ मिनट के लिए अच्छी तरह फ्राई करें।',
    },
    'indo-chinese chilli chicken': {
      'mr': '१. चिकन मॅरीनेट करून कुरकुरीत तळून घ्या. २. आले, लसूण, हिरवी मिरची आणि कांदा परता. ३. सॉस आणि कॉर्नस्टार्चचे पाणी घाला. ४. चिकनचे तुकडे टॉस करा आणि कांद्याच्या पातीसह सजवा.',
      'hi': '१. चिकन के टुकड़ों को मैरीनेट करके क्रिस्पी फ्राई करें। २. अदरक, लहसुन, हरी मिर्च और प्याज भूनें। ३. सॉस और कॉर्नस्टार्च का घोल डालें। ४. चिकन मिलाकर ऊपर से हरी प्याज डालें।',
    },
    'classic margherita pizza': {
      'mr': '१. पिझ्झा बेस लाटून घ्या. २. टोमॅटो हर्ब प्युरी समान रीतीने पसरवा. ३. चीज/पनीरचे तुकडे आणि तुळशीची पाने लावा. ४. २२०°C वर १२-१५ मिनिटे सोनेरी होईपर्यंत बेक करा.',
      'hi': '१. पिज़्ज़ा बेस तैयार करें। २. टमाटर की हर्ब प्यूरी समान रूप से फैलाएं। ३. चीज़/पनीर के टुकड़े और ताजी तुलसी लगाएं। ४. २२०°C पर १२-१५ मिनट तक बेक करें।',
    },
    'classic south indian masala dosa': {
      'mr': '१. कांद्यासह बटाट्याची भाजी तयार करा. २. गरम तव्यावर बटर लावून डोशाचे पीठ पातळ पसरवा. ३. सोनेरी कुरकुरीत होईपर्यंत भाजून बटाट्याची भाजी भरा, घडी घालून सर्व्ह करा.',
      'hi': '१. प्याज के साथ मसालेदार आलू की भाजी तैयार करें। २. गर्म तवे पर मक्खन लगाकर डोसे का घोल पतला फैलाएं। ३. सुनहरा कुरकुरा होने तक सेकें, आलू भरें और मोड़कर परोसें।',
    },
    'steamed idli sambar platter': {
      'mr': '१. इडलीच्या पात्रात १०-१२ मिनिटे पीठ वाफवून घ्या. २. डाळ, कांदा आणि टोमॅटोसह गरमागरम सुगंधित सांबार बनवा. ३. सांबारमध्ये बुडवून ताज्या इडल्या सर्व्ह करा.',
      'hi': '१. इडली के सांचे में १०-१२ मिनट घोल को भाप में पकाएं। २. दाल, प्याज और टमाटर के साथ स्वादिष्ट सांभर बनाएं। ३. सांभर और चटनी के साथ गरमा-गरम इडली परोसें।',
    },
  };

  static String recipeInstructions(String rawInstructions, String localeCode, {String? recipeTitle}) {
    if (rawInstructions.isEmpty || localeCode == 'en') return rawInstructions;

    if (recipeTitle != null) {
      final titleKey = recipeTitle.trim().toLowerCase();
      for (final entry in _recipeInstructionsMap.entries) {
        if (titleKey.contains(entry.key)) {
          return entry.value[localeCode] ?? rawInstructions;
        }
      }
    }

    final lower = rawInstructions.trim().toLowerCase();
    for (final entry in _recipeInstructionsMap.entries) {
      if (lower.contains(entry.key) || entry.key.split(' ').any((w) => lower.contains(w))) {
        return entry.value[localeCode] ?? rawInstructions;
      }
    }

    return formatDigits(rawInstructions, localeCode);
  }

  // ==========================================
  // INGREDIENTS & NOTES
  // ==========================================
  static String ingredientName(String rawName, String localeCode) {
    return productName(rawName, localeCode);
  }

  static String ingredientQuantity(double quantity, String rawUnit, String localeCode) {
    String qtyStr;
    if (quantity == quantity.roundToDouble()) {
      qtyStr = quantity.toInt().toString();
    } else {
      qtyStr = quantity.toStringAsFixed(
        (quantity * 10).truncateToDouble() == quantity * 10 ? 1 : 2,
      );
    }

    if (localeCode == 'en') {
      return '$qtyStr $rawUnit';
    }

    final devQty = formatDigits(qtyStr, localeCode);
    final localizedUnit = unit(rawUnit, localeCode);
    return '$devQty $localizedUnit';
  }

  static String? ingredientNotes(String? notes, String localeCode) {
    if (notes == null || notes.isEmpty || localeCode == 'en') return notes;
    final lower = notes.trim().toLowerCase();

    if (lower.contains('pureed')) {
      return localeCode == 'mr' ? 'ताजी प्युरी केलेले' : 'ताजी प्यूरी की हुई';
    }
    if (lower.contains('salted butter')) {
      return localeCode == 'mr' ? 'खारवलेले बटर' : 'नमकीन मक्खन';
    }
    if (lower.contains('full cream')) {
      return localeCode == 'mr' ? 'फुल क्रीम दूध' : 'फुल क्रीम दूध';
    }
    if (lower.contains('finely sliced') || lower.contains('sliced')) {
      return localeCode == 'mr' ? 'बारीक चिरलेले' : 'बारीक कटा हुआ';
    }
    if (lower.contains('cubes') || lower.contains('cubed')) {
      return localeCode == 'mr' ? 'चौकोनी तुकडे' : 'चौकोर टुकड़े';
    }
    if (lower.contains('curry cut')) {
      return localeCode == 'mr' ? 'करी कट तुकडे' : 'करी कट टुकड़े';
    }

    return notes;
  }
}

/// Helpful UI Extensions for clean zero-boilerplate access to localized content
extension LocalizedProductModel on ProductModel {
  String localizedName(BuildContext context) {
    return ContentLocalizer.productName(name, Localizations.localeOf(context).languageCode);
  }

  String localizedUnit(BuildContext context) {
    return ContentLocalizer.unit(unit, Localizations.localeOf(context).languageCode);
  }

  String? localizedDescription(BuildContext context) {
    return description != null
        ? ContentLocalizer.productDescription(description, Localizations.localeOf(context).languageCode)
        : null;
  }
}

extension LocalizedRecipeModel on RecipeModel {
  String localizedTitle(BuildContext context) {
    return ContentLocalizer.recipeTitle(title, Localizations.localeOf(context).languageCode);
  }

  String? localizedDescription(BuildContext context) {
    return description != null
        ? ContentLocalizer.recipeDescription(description, Localizations.localeOf(context).languageCode, recipeTitle: title)
        : null;
  }

  String localizedCuisine(BuildContext context) {
    return ContentLocalizer.recipeCuisine(cuisine, Localizations.localeOf(context).languageCode);
  }

  String localizedInstructions(BuildContext context) {
    return ContentLocalizer.recipeInstructions(instructions, Localizations.localeOf(context).languageCode, recipeTitle: title);
  }
}

extension LocalizedRecipeIngredientModel on RecipeIngredientModel {
  String localizedName(BuildContext context) {
    return ContentLocalizer.ingredientName(name, Localizations.localeOf(context).languageCode);
  }

  String localizedFormattedQuantity(BuildContext context) {
    if (rawMeasure != null && rawMeasure!.trim().isNotEmpty) {
      return ContentLocalizer.formatDigits(
        rawMeasure!.trim(),
        Localizations.localeOf(context).languageCode,
      );
    }
    if (quantity == 0 && unit.trim().isEmpty) {
      return '';
    }
    return ContentLocalizer.ingredientQuantity(quantity, unit, Localizations.localeOf(context).languageCode);
  }

  String? localizedNotes(BuildContext context) {
    return ContentLocalizer.ingredientNotes(notes, Localizations.localeOf(context).languageCode);
  }
}
