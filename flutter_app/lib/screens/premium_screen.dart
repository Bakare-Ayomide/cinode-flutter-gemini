import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'checkout_screen.dart';

class PremiumScreen extends StatefulWidget {
  final String userEmail;
  const PremiumScreen({super.key, required this.userEmail});

  @override
  State<PremiumScreen> createState() => _PremiumScreenState();
}

class _PremiumScreenState extends State<PremiumScreen> {
  Map<String, dynamic>? _publicSettings;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final settings = await ApiService().getPublicSettings();
    if (mounted) {
      setState(() {
        _publicSettings = settings;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(backgroundColor: Color(0xFF0A0A0B), body: Center(child: CircularProgressIndicator(color: Colors.red)));
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0B),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        toolbarHeight: 40,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.arrow_back, color: Colors.white60, size: 20),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal: MediaQuery.of(context).size.width > 600 ? 40 : 16,
            vertical: 10,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'CINODE ULTIMATE',
                style: GoogleFonts.manrope(
                  fontSize: MediaQuery.of(context).size.width > 600 ? 32 : 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -1,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'UNLIMITED ARCHIVE ACCESS. MASTER STREAMS. ZERO LIMITS.',
                style: TextStyle(color: Colors.white24, fontSize: 8, letterSpacing: 2, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 25),
              _buildTiers(context),
              const SizedBox(height: 30),
              _buildValueProps(context),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTiers(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 900;
    if (isMobile) {
      return Column(
        children: [
          _buildTierCard(
            context: context,
            title: 'CLASSIC MONTHLY',
            price: _publicSettings?['premium_price_naira_monthly'] ?? '1,500',
            label: '/ MONTH',
          ),
          const SizedBox(height: 15),
          _buildTierCard(
            context: context,
            title: 'IMPERIAL ANNUAL',
            price: _publicSettings?['premium_price_naira_yearly'] ?? '15,000',
            label: '/ YEAR',
            isPopular: true,
          ),
        ],
      );
    }
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: _buildTierCard(
            context: context,
            title: 'CLASSIC MONTHLY',
            price: _publicSettings?['premium_price_naira_monthly'] ?? '1,500',
            label: '/ MONTH',
          ),
        ),
        const SizedBox(width: 30),
        Expanded(
          child: _buildTierCard(
            context: context,
            title: 'IMPERIAL ANNUAL',
            price: _publicSettings?['premium_price_naira_yearly'] ?? '15,000',
            label: '/ YEAR',
            isPopular: true,
          ),
        ),
      ],
    );
  }

  Widget _buildTierCard({
    required BuildContext context,
    required String title,
    required String price,
    required String label,
    bool isPopular = false,
  }) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: isPopular ? const Color(0xFF161618) : Colors.transparent,
        border: Border.all(color: isPopular ? Colors.redAccent.withOpacity(0.3) : Colors.white12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (isPopular)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: Colors.redAccent, borderRadius: BorderRadius.circular(4)),
              child: const Text('BEST VALUE', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1)),
            ),
          Text(title, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 2, color: Colors.white24)),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text('₦$price', style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -1)),
              Text(' $label', style: const TextStyle(color: Colors.white24, fontSize: 10, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 20),
          _buildFeature('4K ULTRA HDR STREAMING'),
          _buildFeature('OFFLINE VAULT ACCESS'),
          _buildFeature('ZERO AD EXPERIENCE'),
          _buildFeature('PRIORITY SUPPORT'),
          const SizedBox(height: 25),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: isPopular ? Colors.redAccent : Colors.white,
                foregroundColor: isPopular ? Colors.white : Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => CheckoutScreen(userEmail: widget.userEmail)));
              },
              child: const Text('PURCHASE ACCESS', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2, fontSize: 10)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeature(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          const Icon(Icons.check_circle_outline, color: Colors.redAccent, size: 12),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: const TextStyle(color: Colors.white54, fontSize: 9, fontWeight: FontWeight.bold))),
        ],
      ),
    );
  }

  Widget _buildValueProps(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 600;
    if (isMobile) {
      return Column(
        children: [
          _buildProp('OFFLINE', 'Take your cinema anywhere. No internet required.', isExpanded: false),
          const SizedBox(height: 30),
          _buildProp('QUALITY', 'Stunning 4K resolution at 60 frames per second.', isExpanded: false),
          const SizedBox(height: 30),
          _buildProp('ACCESS', 'Early preview of all future archive additions.', isExpanded: false),
        ],
      );
    }
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

  Widget _buildProp(String title, String desc, {bool isExpanded = true}) {
    final content = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(title, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 4, color: Colors.redAccent)),
        const SizedBox(height: 12),
        Text(desc, style: const TextStyle(color: Colors.white24, fontSize: 11, height: 1.4)),
      ],
    );

    if (isExpanded) {
      return Expanded(child: content);
    }
    return content;
  }
}

