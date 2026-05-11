import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import 'checkout_screen.dart';
import 'affiliate_dashboard_screen.dart';

class ProfileScreen extends StatefulWidget {
  final String userEmail;
  final VoidCallback onLogout;
  const ProfileScreen({super.key, required this.userEmail, required this.onLogout});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _userData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchUserData();
  }

  Future<void> _fetchUserData() async {
    final api = ApiService();
    final data = await api.getMe(widget.userEmail);
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

    final isPremium = _userData?['is_premium'] == true || _userData?['is_premium'] == 1;

    return SingleChildScrollView(
      padding: EdgeInsets.symmetric(
        horizontal: MediaQuery.of(context).size.width > 600 ? 60 : 20,
        vertical: 40,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'THE IDENTITY',
            style: GoogleFonts.manrope(
              fontSize: MediaQuery.of(context).size.width > 600 ? 48 : 32,
              fontWeight: FontWeight.bold,
              letterSpacing: -1,
            ),
          ),
          const SizedBox(height: 30),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.02),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: MediaQuery.of(context).size.width > 600 ? 50 : 35,
                  backgroundColor: Colors.white.withOpacity(0.05),
                  child: Icon(Icons.person_outline, size: MediaQuery.of(context).size.width > 600 ? 40 : 30, color: Colors.white24),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.userEmail, 
                        style: TextStyle(
                          fontSize: MediaQuery.of(context).size.width > 600 ? 20 : 16, 
                          fontWeight: FontWeight.w600,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: isPremium ? Colors.yellow.withOpacity(0.1) : Colors.white10,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: isPremium ? Colors.yellow.withOpacity(0.2) : Colors.transparent),
                            ),
                            child: Text(
                              isPremium ? 'PREMIUM ARCHIVE' : 'FREE ACCESS',
                              style: TextStyle(
                                fontSize: 8,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1,
                                color: isPremium ? Colors.yellow[700] : Colors.white38,
                              ),
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
          const SizedBox(height: 40),
          if (!isPremium) _buildUpgradeCard(),
          const SizedBox(height: 30),
          _buildSettingsSection(),
        ],
      ),
    );
  }

  Widget _buildUpgradeCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.redAccent.withOpacity(0.1), Colors.transparent],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.redAccent.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('UNLIMITED CINEMA', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 2, color: Colors.redAccent)),
          const SizedBox(height: 12),
          Text(
            'Upgrade for offline downloads and 4K streaming.',
            style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w500, color: Colors.white),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => CheckoutScreen(userEmail: widget.userEmail)));
              },
              child: const Text('UPGRADE NOW', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 1, fontSize: 12)),
            ),
          ),
        ],
      ),
    );
  }

  void _showSettingsDetail(String title) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF0D0D0E),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(30))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(30),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title.toUpperCase(), style: GoogleFonts.playfairDisplay(fontSize: 24, fontStyle: FontStyle.italic)),
                IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close, color: Colors.white24)),
              ],
            ),
            const SizedBox(height: 10),
            const Text('CONFIGURATION MODULE', style: TextStyle(fontSize: 8, letterSpacing: 2, color: Colors.white24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 40),
            _buildDetailToggle('ENABLE ENGINE', 'Activate system-level optimization', true),
            const SizedBox(height: 20),
            _buildDetailToggle('ADVANCED MODE', 'Unlock scrupulous overrides', false),
            const SizedBox(height: 40),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.black),
                onPressed: () => Navigator.pop(context),
                child: const Text('SYNC CHANGES', style: TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2, fontSize: 10)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailToggle(String title, String desc, bool active) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
            const SizedBox(height: 4),
            Text(desc, style: const TextStyle(fontSize: 9, color: Colors.white24)),
          ],
        ),
        Switch(value: active, onChanged: (v) {}, activeColor: Colors.redAccent),
      ],
    );
  }

  Widget _buildSettingsSection() {
    final isAffiliate = _userData?['is_affiliate'] == true || _userData?['is_affiliate'] == 1;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('PREFERENCES', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 2, color: Colors.white24)),
        const SizedBox(height: 20),
        if (isAffiliate) _buildSettingItem(Icons.campaign_outlined, 'Affiliate Portal', onTap: () {
          Navigator.push(context, MaterialPageRoute(builder: (context) => AffiliateDashboardScreen(userEmail: widget.userEmail)));
        }),
        _buildSettingItem(Icons.notifications_outlined, 'Notifications', onTap: () => _showSettingsDetail('Notifications')),
        _buildSettingItem(Icons.lock_outline, 'Privacy & Security', onTap: () => _showSettingsDetail('Privacy')),
        _buildSettingItem(Icons.settings_outlined, 'Playback', onTap: () => _showSettingsDetail('Playback')),
        _buildSettingItem(Icons.volume_up_outlined, 'Audio', onTap: () => _showSettingsDetail('Audio')),
        _buildSettingItem(Icons.help_outline, 'Support', onTap: () => _showSettingsDetail('Support')),
        const SizedBox(height: 20),
        GestureDetector(
          onTap: widget.onLogout,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.redAccent.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.redAccent.withOpacity(0.1)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.logout, size: 18, color: Colors.redAccent),
                const SizedBox(width: 12),
                Text(
                  'LOGOUT',
                  style: GoogleFonts.manrope(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                    color: Colors.redAccent,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSettingItem(IconData icon, String title, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.02),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: Colors.white38),
            const SizedBox(width: 16),
            Text(title, style: const TextStyle(fontSize: 13, color: Colors.white70, fontWeight: FontWeight.w500)),
            const Spacer(),
            const Icon(Icons.chevron_right, size: 16, color: Colors.white10),
          ],
        ),
      ),
    );
  }
}

