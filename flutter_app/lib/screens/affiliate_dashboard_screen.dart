import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class AffiliateDashboardScreen extends StatefulWidget {
  final String userEmail;
  const AffiliateDashboardScreen({super.key, required this.userEmail});

  @override
  State<AffiliateDashboardScreen> createState() => _AffiliateDashboardScreenState();
}

class _AffiliateDashboardScreenState extends State<AffiliateDashboardScreen> {
  Map<String, dynamic>? _data;
  bool _isLoading = true;
  String _activeTab = 'overview';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final data = await ApiService().getAffiliateDashboard(widget.userEmail);
    if (mounted) {
      setState(() {
        _data = data;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF0A0A0B),
        body: Center(child: CircularProgressIndicator(color: Colors.red)),
      );
    }

    if (_data == null) {
      return Scaffold(
        backgroundColor: const Color(0xFF0A0A0B),
        appBar: AppBar(backgroundColor: Colors.transparent, elevation: 0),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.people_outline, size: 64, color: Colors.white24),
              const SizedBox(height: 20),
              Text('NOT AN AFFILIATE', style: GoogleFonts.manrope(fontWeight: FontWeight.bold, letterSpacing: 2)),
              const SizedBox(height: 10),
              const Text('Only approved partners can access this portal.', style: TextStyle(color: Colors.white54)),
              const SizedBox(height: 30),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.white10),
                child: const Text('BACK'),
              )
            ],
          ),
        ),
      );
    }

    final stats = _data!['stats'];
    final affiliate = _data!['affiliate'];

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0B),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            backgroundColor: const Color(0xFF0A0A0B),
            floating: true,
            title: Text('PARTNER PORTAL', style: GoogleFonts.manrope(fontSize: 10, letterSpacing: 4, fontWeight: FontWeight.black)),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('WELCOME,', style: TextStyle(color: Colors.white24, fontSize: 10, letterSpacing: 2, fontWeight: FontWeight.bold)),
                          Text(widget.userEmail.split('@')[0].toUpperCase(), 
                            style: GoogleFonts.manrope(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -1)),
                        ],
                      ),
                      _buildReferralBadge(affiliate['referral_code']),
                    ],
                  ),
                  const SizedBox(height: 30),
                  _buildStatsGrid(stats),
                  const SizedBox(height: 30),
                  _buildTabSwitcher(),
                  const SizedBox(height: 20),
                  _buildActiveContent(),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReferralBadge(String code) {
    return GestureDetector(
      onTap: () {
        Clipboard.setData(ClipboardData(text: code));
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Copied to clipboard')));
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white10),
        ),
        child: Column(
          children: [
            const Text('YOUR CODE', style: TextStyle(color: Colors.white24, fontSize: 8, letterSpacing: 2, fontWeight: FontWeight.bold)),
            Text(code, style: GoogleFonts.spaceMono(color: Colors.redAccent, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 2)),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsGrid(Map<String, dynamic> stats) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      childAspectRatio: 1.5,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      children: [
        _buildStatCard('REFERRALS', stats['total_referrals'].toString(), Icons.people, Colors.blue),
        _buildStatCard('PAID', stats['paid_referrals'].toString(), Icons.check_circle, Colors.green),
        _buildStatCard('EARNINGS', '₦${stats['total_earnings']}', Icons.payments, Colors.redAccent),
        _buildStatCard('PENDING', '₦${stats['pending_earnings']}', Icons.history, Colors.orange),
      ],
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color.withOpacity(0.5), size: 16),
          const SizedBox(height: 10),
          Text(label, style: const TextStyle(color: Colors.white24, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 1)),
          Text(value, style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.white)),
        ],
      ),
    );
  }

  Widget _buildTabSwitcher() {
    return Row(
      children: [
        _buildTabButton('OVERVIEW', 'overview'),
        _buildTabButton('REFERRALS', 'referrals'),
        _buildTabButton('EARNINGS', 'earnings'),
      ],
    );
  }

  Widget _buildTabButton(String label, String id) {
    final active = _activeTab == id;
    return GestureDetector(
      onTap: () => setState(() => _activeTab = id),
      child: Container(
        margin: const EdgeInsets.only(right: 10),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: active ? Colors.redAccent : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(15),
        ),
        child: Text(label, style: TextStyle(color: active ? Colors.white : Colors.white54, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1)),
      ),
    );
  }

  Widget _buildActiveContent() {
    if (_activeTab == 'overview') return _buildOverview();
    if (_activeTab == 'referrals') return _buildReferrals();
    return _buildEarnings();
  }

  Widget _buildOverview() {
    return Column(
      children: [
        _buildStepItem(1, 'SHARE YOUR CODE', 'Send your unique code to friends and family. More shares, more wealth.'),
        _buildStepItem(2, 'THEY UPGRADE', 'When they use your code during upgrade and their payment is approved, you earn!'),
        _buildStepItem(3, 'EARN 20% COMMISSION', 'Every approved subscription nets you a 20% instant partner earning. Scalable growth.'),
      ],
    );
  }

  Widget _buildStepItem(int step, String title, String desc) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        children: [
          Container(
            width: 30, h: 30,
            decoration: BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle),
            child: Center(child: Text('$step', style: const TextStyle(fontWeight: FontWeight.bold))),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1)),
                const SizedBox(height: 4),
                Text(desc, style: const TextStyle(color: Colors.white54, fontSize: 10)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReferrals() {
    final List referrals = _data!['referrals'];
    if (referrals.isEmpty) return const Text('No referrals yet.', style: TextStyle(color: Colors.white24));
    return Column(
      children: referrals.map((r) => ListTile(
        title: Text(r['referred_user_email'], style: const TextStyle(color: Colors.white, fontSize: 12)),
        subtitle: Text(r['created_at'].toString().split('T')[0], style: const TextStyle(color: Colors.white24, fontSize: 10)),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: (r['is_premium'] == 1 || r['is_premium'] == true) ? Colors.green.withOpacity(0.1) : Colors.white10,
            borderRadius: BorderRadius.circular(5),
          ),
          child: Text((r['is_premium'] == 1 || r['is_premium'] == true) ? 'PAID' : 'FREE', 
            style: TextStyle(color: (r['is_premium'] == 1 || r['is_premium'] == true) ? Colors.green : Colors.white24, fontSize: 8, fontWeight: FontWeight.bold)),
        ),
      )).toList(),
    );
  }

  Widget _buildEarnings() {
    final List earnings = _data!['earnings'];
    if (earnings.isEmpty) return const Text('No earnings recorded yet.', style: TextStyle(color: Colors.white24));
    return Column(
      children: earnings.map((e) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.01),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.03)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'REFERRAL COMMISSION', 
                    style: GoogleFonts.manrope(color: Colors.white10, fontSize: 7, fontWeight: FontWeight.black, letterSpacing: 2)
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '₦${NumberFormat('#,###').format(double.parse(e['amount'].toString()))}', 
                    style: GoogleFonts.manrope(color: Colors.white, fontWeight: FontWeight.black, fontSize: 16)
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text('SALE: ₦${NumberFormat('#,###').format(double.parse((e['total_amount'] ?? 0).toString()))}', style: TextStyle(color: Colors.white24, fontSize: 9)),
                      const SizedBox(width: 8),
                      Text('•', style: TextStyle(color: Colors.white10, fontSize: 9)),
                      const SizedBox(width: 8),
                      Text(e['created_at'].toString().split('T')[0], style: const TextStyle(color: Colors.white10, fontSize: 9)),
                    ],
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: e['status'] == 'paid' ? Colors.blue.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                e['status'].toString().toUpperCase(), 
                style: TextStyle(color: e['status'] == 'paid' ? Colors.blue : Colors.orange, fontSize: 8, fontWeight: FontWeight.black, letterSpacing: 1)
              ),
            ),
          ],
        ),
      )).toList(),
    );
  }
}
