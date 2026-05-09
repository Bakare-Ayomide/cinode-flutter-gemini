import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'checkout_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final String _userEmail = "contactzerolord@gmail.com";
  Map<String, dynamic>? _userData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchUserData();
  }

  Future<void> _fetchUserData() async {
    final api = ApiService();
    final data = await api.getMe(_userEmail);
    if (mounted) {
      setState(() {
        _userData = data;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Colors.redAccent));
    }

    final isPremium = _userData?['is_premium'] == true;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 60, vertical: 60),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'PROFILE',
            style: GoogleFonts.playfairDisplay(
              fontSize: 64,
              fontStyle: FontStyle.italic,
              fontWeight: FontWeight.w300,
            ),
          ),
          const SizedBox(height: 60),
          Row(
            children: [
              const CircleAvatar(
                radius: 60,
                backgroundColor: Colors.white10,
                child: Icon(Icons.person_outline, size: 60, color: Colors.white24),
              ),
              const SizedBox(width: 40),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_userEmail, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: isPremium ? Colors.yellow[700] : Colors.white10,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      isPremium ? 'PREMIUM MEMBER' : 'FREE ACCOUNT',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 2,
                        color: isPremium ? Colors.black : Colors.white38,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 80),
          if (!isPremium) _buildUpgradeCard(),
          const SizedBox(height: 40),
          _buildSettingsSection(),
        ],
      ),
    );
  }

  Widget _buildUpgradeCard() {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A1B),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('UNLIMITED CINEMA', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 4, color: Colors.redAccent)),
          const SizedBox(height: 20),
          Text(
            'Upgrade to Premium for offline downloads, 4K streaming, and zero interruptions.',
            style: GoogleFonts.playfairDisplay(fontSize: 28, fontStyle: FontStyle.italic, color: Colors.white70),
          ),
          const SizedBox(height: 40),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 20),
            ),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (context) => const CheckoutScreen()));
            },
            child: const Text('UPGRADE NOW', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2)),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('SETTINGS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 4, color: Colors.white24)),
        const SizedBox(height: 30),
        _buildSettingItem(Icons.notifications_outlined, 'Notifications'),
        _buildSettingItem(Icons.lock_outline, 'Privacy & Security'),
        _buildSettingItem(Icons.help_outline, 'Support Center'),
        _buildSettingItem(Icons.info_outline, 'About Cinema App'),
      ],
    );
  }

  Widget _buildSettingItem(IconData icon, String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.white38),
          const SizedBox(width: 20),
          Text(title, style: const TextStyle(fontSize: 14, color: Colors.white70)),
          const Spacer(),
          const Icon(Icons.chevron_right, size: 16, color: Colors.white10),
        ],
      ),
    );
  }
}
