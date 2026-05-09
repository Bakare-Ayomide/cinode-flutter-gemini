import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  Map<String, dynamic>? _stats;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    // In a real app we would have an admin endpoint in ApiService
    // For now we'll just show a placeholder UI to match the TS app's spirit
    setState(() {
      _stats = {
        'users': 24,
        'reviews': 156,
        'overrides': 8,
      };
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(60.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'ADMIN PANEL',
            style: GoogleFonts.playfairDisplay(
              fontSize: 72,
              fontStyle: FontStyle.italic,
              fontWeight: FontWeight.w300,
            ),
          ),
          const SizedBox(height: 60),
          Row(
            children: [
              _buildStatCard('USERS', _stats?['users']?.toString() ?? '0'),
              const SizedBox(width: 30),
              _buildStatCard('REVIEWS', _stats?['reviews']?.toString() ?? '0'),
              const SizedBox(width: 30),
              _buildStatCard('OVERRIDES', _stats?['overrides']?.toString() ?? '0'),
            ],
          ),
          const SizedBox(height: 60),
          _buildSettingsPanel(),
          const SizedBox(height: 60),
          const Text('SYSTEM OVERRIDES', style: TextStyle(letterSpacing: 4, color: Colors.white24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 30),
          Expanded(
            child: ListView(
              children: [
                _buildOverrideItem('Inception', 'Movie', 'https://vidsrc.me/embed/movie/tt0137523'),
                _buildOverrideItem('Breaking Bad', 'TV', 'https://vidsrc.me/embed/tv/tt0903747'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsPanel() {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('SYSTEM SETTINGS', style: TextStyle(letterSpacing: 4, color: Colors.white24, fontWeight: FontWeight.bold, fontSize: 10)),
          const SizedBox(height: 30),
          _buildSettableField('PREMIUM PRICE (MONTHLY)', '9.99', 'premium_price_monthly'),
          const SizedBox(height: 30),
          _buildSettableField('PAYMENT INFORMATION', 'PayPal: admin@example.com', 'payment_info'),
        ],
      ),
    );
  }

  Widget _buildSettableField(String label, String value, String key) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.white38, letterSpacing: 2)),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(child: Text(value, style: const TextStyle(fontSize: 16))),
            IconButton(
              onPressed: () => _showEditSettingDialog(label, value, key),
              icon: const Icon(Icons.edit, size: 16, color: Colors.white24),
            ),
          ],
        ),
      ],
    );
  }

  void _showEditSettingDialog(String label, String value, String key) {
    final controller = TextEditingController(text: value);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1A1B),
        title: Text('Edit $label', style: const TextStyle(color: Colors.white)),
        content: TextField(
          controller: controller,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white12)),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('CANCEL')),
          TextButton(
            onPressed: () async {
              // Real implementation would call ApiService to save setting
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Setting updated globally')));
            },
            child: const Text('SAVE', style: TextStyle(color: Colors.redAccent)),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value) {
    return Container(
      width: 200,
      padding: const EdgeInsets.all(30),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 10, letterSpacing: 2, color: Colors.white38)),
          const SizedBox(height: 10),
          Text(value, style: GoogleFonts.playfairDisplay(fontSize: 32)),
        ],
      ),
    );
  }

  Widget _buildOverrideItem(String title, String type, String url) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
              Text(type, style: const TextStyle(color: Colors.white24, fontSize: 10)),
            ],
          ),
          const Spacer(),
          Text(url, style: const TextStyle(color: Colors.white38, fontSize: 10)),
          const SizedBox(width: 20),
          IconButton(onPressed: () {}, icon: const Icon(Icons.edit, size: 16, color: Colors.white24)),
          IconButton(onPressed: () {}, icon: const Icon(Icons.delete, size: 16, color: Colors.redAccent)),
        ],
      ),
    );
  }
}
