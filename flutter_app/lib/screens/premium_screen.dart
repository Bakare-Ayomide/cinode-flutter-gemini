import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'checkout_screen.dart';

class PremiumScreen extends StatelessWidget {
  const PremiumScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0B),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 60, vertical: 80),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'PREMIUM',
                style: GoogleFonts.playfairDisplay(
                  fontSize: 64,
                  fontStyle: FontStyle.italic,
                  fontWeight: FontWeight.w300,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'The ultimate cinematic experience, unlocked.',
                style: TextStyle(color: Colors.white24, letterSpacing: 2),
              ),
              const SizedBox(height: 80),
              _buildTierCard(
                context: context,
                title: 'CINELIST MASTER',
                price: '9.99',
                features: [
                  'Offline Movie Vault',
                  'High Fidelity 4K Streaming',
                  'Unlimited Watchlists',
                  'Archive Access Overrides',
                  'Priority Curator Support'
                ],
                isPopular: true,
              ),
              const SizedBox(height: 60),
              _buildValueProps(),
              const SizedBox(height: 100),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTierCard({
    required BuildContext context,
    required String title,
    required String price,
    required List<String> features,
    bool isPopular = false,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(50),
      decoration: BoxDecoration(
        color: isPopular ? const Color(0xFF1A1A1B) : Colors.transparent,
        border: Border.all(color: Colors.white12),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isPopular)
            Padding(
              padding: const EdgeInsets.only(bottom: 20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: Colors.redAccent, borderRadius: BorderRadius.circular(4)),
                child: const Text('MOST CURATED', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
              ),
            ),
          Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 4, color: Colors.white24)),
          const SizedBox(height: 20),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text('\$$price', style: GoogleFonts.playfairDisplay(fontSize: 72, fontWeight: FontWeight.w300)),
              const Text(' / month', style: TextStyle(color: Colors.white24, letterSpacing: 1)),
            ],
          ),
          const SizedBox(height: 60),
          ...features.map((f) => Padding(
            padding: const EdgeInsets.only(bottom: 20),
            child: Row(
              children: [
                const Icon(Icons.check, color: Colors.redAccent, size: 16),
                const SizedBox(width: 20),
                Text(f, style: const TextStyle(color: Colors.white70, fontSize: 16)),
              ],
            ),
          )),
          const SizedBox(height: 60),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 25),
              ),
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => const CheckoutScreen()));
              },
              child: const Text('START ASCENSION', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 4)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildValueProps() {
    return Row(
      children: [
        _buildProp('OFFLINE', 'Take your cinema anywhere. No internet required.'),
        const SizedBox(width: 40),
        _buildProp('QUALITY', 'Stunning 4K resolution at 60 frames per second.'),
        const SizedBox(width: 40),
        _buildProp('ACCESS', 'Early preview of all future archive additions.'),
      ],
    );
  }

  Widget _buildProp(String title, String desc) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 4, color: Colors.redAccent)),
          const SizedBox(height: 20),
          Text(desc, style: const TextStyle(color: Colors.white24, fontSize: 12, height: 1.5)),
        ],
      ),
    );
  }
}
