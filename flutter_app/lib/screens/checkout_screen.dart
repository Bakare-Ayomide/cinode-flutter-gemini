import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _emailController = TextEditingController(text: "contactzerolord@gmail.com");
  bool _isProcessing = false;
  Map<String, dynamic>? _settings;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final settings = await ApiService().getPublicSettings();
    setState(() {
      _settings = settings;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0B),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Text('PREMIUM ACCESS', style: GoogleFonts.playfairDisplay(letterSpacing: 2)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'UNLIMITED CINEMA',
              style: GoogleFonts.playfairDisplay(
                fontSize: 64,
                fontStyle: FontStyle.italic,
                fontWeight: FontWeight.w300,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Unlock offline downloads, premium quality, and exclusive curator collections.',
              style: TextStyle(color: Colors.white54, fontSize: 16),
            ),
            const SizedBox(height: 60),
            Container(
              padding: const EdgeInsets.all(40),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white12),
                color: Colors.white.withOpacity(0.02),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('MONTHLY ACCESS', style: TextStyle(letterSpacing: 4, color: Colors.white24, fontWeight: FontWeight.bold, fontSize: 10)),
                  const SizedBox(height: 20),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        '\$${_settings?['premium_price_monthly'] ?? '9.99'}',
                        style: GoogleFonts.playfairDisplay(fontSize: 48),
                      ),
                      const Text(' / month', style: TextStyle(color: Colors.white24)),
                    ],
                  ),
                  const SizedBox(height: 40),
                  _buildFeatureRow('Offline Downloads'),
                  _buildFeatureRow('Curator Overrides'),
                  _buildFeatureRow('4K Ultra HD Streaming'),
                  _buildFeatureRow('Early Access to New Titles'),
                  const SizedBox(height: 60),
                  const Text('PAYMENT INSTRUCTIONS', style: TextStyle(letterSpacing: 4, color: Colors.white24, fontWeight: FontWeight.bold, fontSize: 10)),
                  const SizedBox(height: 10),
                  Text(_settings?['payment_info'] ?? 'PayPal: admin@example.com', style: const TextStyle(color: Colors.white70)),
                  const SizedBox(height: 40),
                  TextField(
                    controller: _emailController,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      labelText: 'VERIFY EMAIL',
                      labelStyle: TextStyle(color: Colors.white24, fontSize: 10, letterSpacing: 2),
                      enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white12)),
                    ),
                  ),
                  const SizedBox(height: 40),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.redAccent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 20),
                      ),
                      onPressed: _isProcessing ? null : _handleCheckout,
                      child: Text(_isProcessing ? 'PROCESSING...' : 'COMPLETE ORDER', style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureRow(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: Row(
        children: [
          const Icon(Icons.check, color: Colors.redAccent, size: 16),
          const SizedBox(width: 15),
          Text(label, style: const TextStyle(color: Colors.white70)),
        ],
      ),
    );
  }

  Future<void> _handleCheckout() async {
    setState(() => _isProcessing = true);
    
    // Simulate payment verification
    await Future.delayed(const Duration(seconds: 2));

    final success = await ApiService().checkout(
      _emailController.text,
      plan: 'Monthly Premium',
      transactionId: 'TXN-${Date.now()}',
    );

    if (mounted) {
      setState(() => _isProcessing = false);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Welcome to Premium!'), backgroundColor: Colors.green),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to complete checkout'), backgroundColor: Colors.red),
        );
      }
    }
  }
}
