import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../services/api_service.dart';

class CheckoutScreen extends StatefulWidget {
  final String userEmail;
  const CheckoutScreen({super.key, required this.userEmail});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  bool _isProcessing = false;
  Map<String, dynamic>? _publicSettings;
  Map<String, dynamic>? _checkoutConfig;
  File? _imageFile;
  
  final _senderNameController = TextEditingController();
  final _refController = TextEditingController();
  final _transactionRefController = TextEditingController();
  String _selectedPlan = 'MONTHLY PREMIUM';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _imageFile = File(pickedFile.path);
        _isAiProcessing = true;
      });
      
      try {
        final api = ApiService();
        final uploadResult = await api.uploadProof(imageFile: _imageFile!);
        if (uploadResult != null && uploadResult['success'] == true) {
          final imageUrl = uploadResult['url'];
          final extracted = await api.extractInfo(imageUrl);
          if (extracted != null && mounted) {
            setState(() {
              _senderNameController.text = extracted['name'] ?? _senderNameController.text;
              _transactionRefController.text = extracted['reference'] ?? _transactionRefController.text;
            });
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('AI DATA SYNCHRONIZED', style: TextStyle(letterSpacing: 2, fontSize: 10, fontWeight: FontWeight.bold))));
          }
        }
      } catch (e) {
        print("AI Extraction failed: $e");
      } finally {
        if (mounted) setState(() => _isAiProcessing = false);
      }
    }
  }

  bool _isAiProcessing = false;

  Future<void> _loadData() async {
    final settings = await ApiService().getPublicSettings();
    final config = await ApiService().getCheckoutConfig();
    if (mounted) {
      setState(() {
        _publicSettings = settings;
        _checkoutConfig = config;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0B),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('PREMIUM MARKETPLACE', style: GoogleFonts.manrope(letterSpacing: 2, fontWeight: FontWeight.black, fontSize: 9, color: Colors.white70)),
            Text('SECURE TRANSACTION PORTAL', style: GoogleFonts.manrope(letterSpacing: 4, fontWeight: FontWeight.black, fontSize: 6, color: Colors.white10)),
          ],
        ),
        actions: [
          IconButton(
            onPressed: () => Navigator.pop(context), 
            icon: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(8)),
              child: const Icon(Icons.close, color: Colors.white24, size: 16)
            )
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('DEPLOYMENT TIER', style: GoogleFonts.manrope(color: Colors.white24, fontSize: 8, letterSpacing: 4, fontWeight: FontWeight.black)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildPlanCard('MONTHLY', '₦1,500', Icons.access_time_rounded)),
                const SizedBox(width: 12),
                Expanded(child: _buildPlanCard('IMPERIAL', '₦15,000', Icons.shield_moon_rounded, isYearly: true)),
              ],
            ),
            
            const SizedBox(height: 32),
            Text('AUTHENTICATION PROTOCOL', style: GoogleFonts.manrope(color: Colors.white24, fontSize: 8, letterSpacing: 4, fontWeight: FontWeight.black)),
            const SizedBox(height: 16),
            _buildBankDetails(),
            
            const SizedBox(height: 32),
            Text('VERIFICATION PROOF', style: GoogleFonts.manrope(color: Colors.white24, fontSize: 8, letterSpacing: 4, fontWeight: FontWeight.black)),
            const SizedBox(height: 16),
            _buildForm(),
            
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              height: 58,
              child: ElevatedButton(
                onPressed: _isProcessing ? null : _handleSubmit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.redAccent, 
                  foregroundColor: Colors.white,
                  elevation: 20,
                  shadowColor: Colors.redAccent.withOpacity(0.3),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))
                ),
                child: Text(_isProcessing ? 'AUTHENTICATING...' : 'CONFIRM PAYMENT', style: GoogleFonts.manrope(fontWeight: FontWeight.black, letterSpacing: 3, fontSize: 10)),
              ),
            ),
            const SizedBox(height: 12),
            Center(
              child: TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text('RETURN TO DASHBOARD', style: GoogleFonts.manrope(color: Colors.white10, fontSize: 8, letterSpacing: 2, fontWeight: FontWeight.black)),
              ),
            ),
            const SizedBox(height: 60),
          ],
        ),
      ),
    );
  }

  Widget _buildPlanCard(String title, String price, IconData icon, {bool isYearly = false}) {
    final active = (isYearly && _selectedPlan.contains('IMPERIAL')) || (!isYearly && _selectedPlan.contains('MONTHLY'));
    return GestureDetector(
      onTap: () => setState(() => _selectedPlan = isYearly ? 'YEARLY IMPERIAL' : 'MONTHLY PREMIUM'),
      child: Container(
        height: 120,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: active ? Colors.redAccent.withOpacity(0.08) : Colors.white.withOpacity(0.01),
          border: Border.all(color: active ? Colors.redAccent.withOpacity(0.5) : Colors.white.withOpacity(0.05), width: 1.5),
          borderRadius: BorderRadius.circular(20),
          boxShadow: active ? [BoxShadow(color: Colors.redAccent.withOpacity(0.05), blurRadius: 20)] : [],
        ),
        child: Stack(
          children: [
            if (isYearly)
              Positioned(
                top: -8, right: -8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: const BoxDecoration(color: Colors.redAccent, borderRadius: BorderRadius.only(bottomLeft: Radius.circular(10))),
                  child: const Text('BEST VALUE', style: TextStyle(color: Colors.white, fontSize: 6, fontWeight: FontWeight.black, letterSpacing: 1)),
                ),
              ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(color: active ? Colors.redAccent.withOpacity(0.2) : Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(10)),
                      child: Icon(icon, color: active ? Colors.redAccent : Colors.white24, size: 18),
                    ),
                    if (active) const Icon(Icons.check_circle_rounded, color: Colors.redAccent, size: 16),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: GoogleFonts.manrope(color: active ? Colors.white : Colors.white38, fontSize: 8, fontWeight: FontWeight.black, letterSpacing: 1)),
                    const SizedBox(height: 2),
                    Text(price, style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -1)),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBankDetails() {
    if (_checkoutConfig == null) return const Center(child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white10));
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.01),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
            Row(
                children: [
                    const Icon(Icons.credit_card, color: Colors.redAccent, size: 14),
                    const SizedBox(width: 10),
                    Text(_checkoutConfig!['bank_name']?.toString().toUpperCase() ?? 'BANK TRANSFER', style: GoogleFonts.manrope(color: Colors.white70, fontSize: 9, fontWeight: FontWeight.black, letterSpacing: 2)),
                ],
            ),
          const SizedBox(height: 20),
          _buildDetailBox('ACCOUNT NAME', _checkoutConfig!['account_name'], Icons.person_outline),
          const SizedBox(height: 12),
          _buildDetailBox('ACCOUNT NUMBER', _checkoutConfig!['account_number'], Icons.numbers, copyable: true, primary: true),
          if (_checkoutConfig!['payment_note']?.isNotEmpty == true) ...[
            const SizedBox(height: 20),
            Text(_checkoutConfig!['payment_note'], style: TextStyle(color: Colors.white.withOpacity(0.15), fontSize: 9,  fontWeight: FontWeight.w500)),
          ]
        ],
      ),
    );
  }

  Widget _buildDetailBox(String label, String value, IconData icon, {bool copyable = false, bool primary = false}) {
    return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
            color: primary ? Colors.redAccent.withOpacity(0.03) : Colors.white.withOpacity(0.01),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: primary ? Colors.redAccent.withOpacity(0.1) : Colors.white.withOpacity(0.03)),
        ),
        child: Row(
            children: [
                Expanded(
                    child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                            Text(label, style: const TextStyle(color: Colors.white10, fontSize: 7, fontWeight: FontWeight.bold, letterSpacing: 1)),
                            const SizedBox(height: 4),
                            Text(value, style: GoogleFonts.spaceMono(color: primary ? Colors.redAccent : Colors.white70, fontSize: primary ? 14 : 11, fontWeight: FontWeight.black, letterSpacing: 1)),
                        ],
                    ),
                ),
                if (copyable)
                    GestureDetector(
                        onTap: () {
                            Clipboard.setData(ClipboardData(text: value));
                            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('COPIED TO CLIPBOARD', style: TextStyle(fontSize: 10, letterSpacing: 2))));
                        },
                        child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(8)),
                            child: const Icon(Icons.copy_rounded, size: 14, color: Colors.white24),
                        ),
                    )
            ],
        ),
    );
  }

  Widget _buildForm() {
    return Column(
      children: [
        Row(
            children: [
                Expanded(child: _buildInput('SENDER NAME', 'PAY ACCOUNT NAME', _senderNameController)),
                const SizedBox(width: 12),
                Expanded(child: _buildInput('TRANSACTION REF', 'TRX-REF', _transactionRefController)),
            ],
        ),
        const SizedBox(height: 12),
        Row(
            children: [
                Expanded(child: _buildInput('REFERRAL CODE', 'OPTIONAL', _refController)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('PAYMENT PROOF', style: GoogleFonts.manrope(color: Colors.white24, fontSize: 7, fontWeight: FontWeight.black, letterSpacing: 2)),
                      const SizedBox(height: 8),
                      GestureDetector(
                        onTap: _pickImage,
                        child: Container(
                          height: 52,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.02),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.white.withOpacity(0.05)),
                          ),
                          child: _imageFile != null 
                            ? Stack(
                                children: [
                                  Image.file(_imageFile!, fit: BoxFit.cover, width: double.infinity, height: 52),
                                  if (_isAiProcessing)
                                    Container(
                                      color: Colors.black54,
                                      child: const Center(
                                        child: SizedBox(
                                          width: 16, height: 16,
                                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.redAccent),
                                        ),
                                      ),
                                    ),
                                ],
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.upload_file_rounded, color: Colors.white.withOpacity(0.1), size: 16),
                                  const SizedBox(width: 8),
                                  Text('SELECT IMAGE', style: GoogleFonts.manrope(color: Colors.white.withOpacity(0.1), fontSize: 8, fontWeight: FontWeight.black)),
                                ],
                              ),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
        ),
      ],
    );
  }

  Widget _buildInput(String label, String hint, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.manrope(color: Colors.white24, fontSize: 7, fontWeight: FontWeight.black, letterSpacing: 2)),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.white.withOpacity(0.05), fontSize: 9),
            filled: true,
            fillColor: Colors.white.withOpacity(0.02),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.white.withOpacity(0.05))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.redAccent, width: 1.5)),
          ),
        ),
      ],
    );
  }

  Future<void> _handleSubmit() async {
    if (_senderNameController.text.isEmpty || _transactionRefController.text.isEmpty || _imageFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('ALL FIELDS AND IMAGE MANDATORY')));
      return;
    }

    setState(() => _isProcessing = true);
    
    try {
        final uploadResult = await ApiService().uploadProof(imageFile: _imageFile!);
        
        if (uploadResult != null && uploadResult['success'] == true) {
            final payload = {
                'user_email': widget.userEmail,
                'plan': _selectedPlan,
                'amount': _selectedPlan.contains('MONTHLY') ? 1500 : 15000,
                'sender_name': _senderNameController.text,
                'transaction_reference': _transactionRefController.text,
                'referral_code': _refController.text,
                'proof_image_url': uploadResult['url'],
                'tracking_answers': []
            };

            final success = await ApiService().submitPayment(payload);
            
            if (mounted) {
                setState(() => _isProcessing = false);
                if (success) {
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        backgroundColor: const Color(0xFF151517),
                        title: const Text('SUBMITTED', style: TextStyle(color: Colors.green, letterSpacing: 2, fontWeight: FontWeight.bold)),
                        content: const Text('Your proof of payment is being reviewed. Access will be granted within 24 hours.'),
                        actions: [
                          TextButton(onPressed: () { Navigator.pop(context); Navigator.pop(context); }, child: const Text('OK'))
                        ],
                      ),
                    );
                } else {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Submission failed. Try again.')));
                }
            }
        } else {
            if (mounted) {
                setState(() => _isProcessing = false);
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Image upload failed.')));
            }
        }
    } catch (e) {
        if (mounted) {
            setState(() => _isProcessing = false);
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('An error occurred.')));
        }
    }
  }
}

