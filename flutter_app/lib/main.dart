import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'screens/home_screen.dart';
import 'services/api_service.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        Provider(create: (_) => ApiService()),
      ],
      child: const CinodeApp(),
    ),
  );
}

class CinodeApp extends StatelessWidget {
  const CinodeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Cinode',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0A0A0B),
        primaryColor: Colors.red[600],
        textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).copyWith(
          displayLarge: GoogleFonts.manrope(
            fontWeight: FontWeight.bold,
            letterSpacing: -1.5,
            color: const Color(0xFFE5E5E5),
          ),
          displayMedium: GoogleFonts.manrope(
            fontWeight: FontWeight.w600,
            letterSpacing: -1,
            color: const Color(0xFFE5E5E5),
          ),
        ),
      ),
      home: const HomeScreen(),
    );
  }
}
