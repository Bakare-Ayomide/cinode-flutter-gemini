import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  Map<String, dynamic>? _stats;
  List<dynamic> _overrides = [];
  List<dynamic> _payments = [];
  List<dynamic> _affiliates = [];
  List<dynamic> _ads = [];
  List<dynamic> _notifications = [];
  List<dynamic> _users = [];
  bool _isLoading = true;
  String _activeTab = 'stats';

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _isLoading = true);
    final api = ApiService();
    final user = "contactzerolord@gmail.com";
    
    try {
      final results = await Future.wait([
        api.getAdminOverrides(user),
        api.getAdminPayments(user),
        api.getAdminAffiliates(user),
        api.getAdminAds(user),
        api.getAdminNotifications(user),
        api.getAdminUsers(user),
      ]);

      if (mounted) {
        setState(() {
          _overrides = results[0];
          _payments = results[1];
          _affiliates = results[2];
          _ads = results[3];
          _notifications = results[4];
          _users = results[5];
          _stats = {
            'users': _users.length,
            'payments': _payments.where((p) => p['status'] == 'pending').length,
            'affiliates': _affiliates.length,
            'overrides': _overrides.length,
          };
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Center(child: CircularProgressIndicator(color: Colors.red));

    return Padding(
      padding: const EdgeInsets.all(40.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'CONTROL CENTER',
            style: GoogleFonts.manrope(
              fontSize: 64,
              
              fontWeight: FontWeight.w300,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 40),
          _buildTabSwitcher(),
          const SizedBox(height: 40),
          Expanded(child: _buildActiveContent()),
        ],
      ),
    );
  }

  Widget _buildTabSwitcher() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _buildTabButton('DASHBOARD', 'stats'),
          _buildTabButton('USERS', 'users'),
          _buildTabButton('PAYMENTS', 'payments'),
          _buildTabButton('AFFILIATES', 'affiliates'),
          _buildTabButton('ADS', 'ads'),
          _buildTabButton('NOTIFICATIONS', 'notifications'),
          _buildTabButton('OVERRIDES', 'overrides'),
        ],
      ),
    );
  }

  Widget _buildTabButton(String label, String id) {
    final active = _activeTab == id;
    return GestureDetector(
      onTap: () => setState(() => _activeTab = id),
      child: Container(
        margin: const EdgeInsets.only(right: 15),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        decoration: BoxDecoration(
          color: active ? Colors.redAccent : Colors.white.withOpacity(0.02),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: active ? Colors.redAccent : Colors.white10),
        ),
        child: Text(label, style: TextStyle(color: active ? Colors.white : Colors.white54, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
      ),
    );
  }

  Widget _buildActiveContent() {
    switch (_activeTab) {
      case 'users': return _buildUsersList();
      case 'payments': return _buildPaymentsList();
      case 'affiliates': return _buildAffiliatesList();
      case 'ads': return _buildAdsList();
      case 'notifications': return _buildNotificationsList();
      case 'overrides': return _buildOverridesList();
      default: return _buildStatsDashboard();
    }
  }

  Widget _buildUsersList() {
    return ListView.builder(
      itemCount: _users.length,
      itemBuilder: (context, index) {
        final user = _users[index];
        return ListTile(
          title: Text(user['email'], style: const TextStyle(color: Colors.white)),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  if (user['is_admin'] == 1) 
                    const Text('ADMIN ', style: TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.bold)),
                  if (user['is_premium'] == 1)
                    const Text('PREMIUM ', style: TextStyle(color: Colors.yellow, fontSize: 10, fontWeight: FontWeight.bold)),
                  Text(user['joined_at']?.split('T')[0] ?? '', style: const TextStyle(color: Colors.white24, fontSize: 10)),
                ],
              ),
              if (user['is_premium'] == 1 && user['premium_expiry'] != null)
                Text('EXPIRES: ${user['premium_expiry'].split('T')[0]}', style: const TextStyle(color: Colors.white24, fontSize: 8, fontWeight: FontWeight.bold)),
            ],
          ),
          trailing: PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: Colors.white54),
            onSelected: (val) => _handleUserAction(user['email'], val, user['is_admin'] == 1),
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'grant_2w', child: Text('Grant 2 Weeks Premium')),
              const PopupMenuItem(value: 'grant_1m', child: Text('Grant 1 Month Premium')),
              const PopupMenuItem(value: 'grant_3m', child: Text('Grant 3 Months Premium')),
              const PopupMenuItem(value: 'grant_6m', child: Text('Grant 6 Months Premium')),
              const PopupMenuItem(value: 'grant_1y', child: Text('Grant 1 Year Premium')),
              const PopupMenuDivider(),
              if (user['is_premium'] == 1)
                const PopupMenuItem(value: 'revoke', child: Text('Discontinue Premium', style: TextStyle(color: Colors.orange))),
              PopupMenuItem(value: 'toggle_admin', child: Text(user['is_admin'] == 1 ? 'Demote Admin' : 'Promote Admin')),
              const PopupMenuItem(value: 'delete', child: Text('Delete User', style: TextStyle(color: Colors.red))),
            ],
          ),
        );
      },
    );
  }

  Future<void> _handleUserAction(String userEmail, String action, bool currentIsAdmin) async {
    final api = ApiService();
    final adminEmail = "contactzerolord@gmail.com";

    try {
      if (action.startsWith('grant_')) {
        final duration = action.split('_')[1];
        await api.grantPremium(adminEmail, userEmail, duration);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Premium granted')));
      } else if (action == 'revoke') {
        await api.revokePremium(adminEmail, userEmail);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Premium revoked')));
      } else if (action == 'toggle_admin') {
        await api.promoteAdmin(adminEmail, userEmail, !currentIsAdmin);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Admin status toggled')));
      } else if (action == 'delete') {
        await api.deleteAdminUser(adminEmail, userEmail);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User deleted')));
      }
      _fetchData();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Action failed')));
    }
  }

  Widget _buildStatsDashboard() {
    final totalPayouts = _affiliates.fold(0.0, (acc, a) => acc + (double.tryParse(a['total_earnings']?.toString() ?? '0') ?? 0.0) - (double.tryParse(a['pending_earnings']?.toString() ?? '0') ?? 0.0));
    final totalOwed = _affiliates.fold(0.0, (acc, a) => acc + (double.tryParse(a['pending_earnings']?.toString() ?? '0') ?? 0.0));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildStatCard('TOTAL PAYOUTS', '₦${NumberFormat('#,###').format(totalPayouts)}', color: Colors.blue),
              const SizedBox(width: 20),
              _buildStatCard('OWED COMMISSIONS', '₦${NumberFormat('#,###').format(totalOwed)}', color: Colors.orange),
              const SizedBox(width: 20),
              _buildStatCard('ACTIVE PARTNERS', _stats?['affiliates']?.toString() ?? '0'),
            ],
          ),
        ),
        const SizedBox(height: 40),
        _buildSettingsPanel(),
      ],
    );
  }

  Widget _buildPaymentsList() {
    return ListView.builder(
      itemCount: _payments.length,
      itemBuilder: (context, index) {
        final p = _payments[index];
        return ListTile(
          title: Text(p['user_email'], style: const TextStyle(color: Colors.white)),
          subtitle: Text("${p['plan']} - ₦${p['amount']}"),
          trailing: Text(p['status'].toString().toUpperCase(), style: TextStyle(color: p['status'] == 'pending' ? Colors.orange : Colors.green)),
          onTap: () => _showPaymentDialog(p),
        );
      },
    );
  }

  void _showPaymentDialog(dynamic p) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF151517),
        title: const Text('REVIEW PAYMENT'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text("Reference: ${p['transaction_reference']}"),
            const SizedBox(height: 10),
            Text("Sender: ${p['sender_name']}"),
          ],
        ),
        actions: [
          TextButton(onPressed: () => _handleReview(p['id'], 'rejected'), child: const Text('REJECT', style: TextStyle(color: Colors.red))),
          TextButton(onPressed: () => _handleReview(p['id'], 'approved'), child: const Text('APPROVE', style: TextStyle(color: Colors.green))),
        ],
      ),
    );
  }

  Future<void> _handleReview(int id, String status) async {
    await ApiService().reviewPayment("contactzerolord@gmail.com", {'id': id, 'status': status});
    Navigator.pop(context);
    _fetchData();
  }

  Widget _buildAffiliatesList() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('PARTNER NETWORK', style: TextStyle(color: Colors.white24, fontSize: 10, letterSpacing: 2)),
            ElevatedButton(onPressed: () {}, child: const Text('NEW PARTNER', style: TextStyle(fontSize: 10))),
          ],
        ),
        const SizedBox(height: 20),
        Expanded(
          child: ListView.builder(
            itemCount: _affiliates.length,
            itemBuilder: (context, index) {
              final a = _affiliates[index];
              return ListTile(
                title: Text(a['user_email'], style: const TextStyle(color: Colors.white)),
                subtitle: Text("Code: ${a['referral_code']}"),
                trailing: Switch(value: a['is_active'] == 1, onChanged: (v) {}),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildAdsList() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('CAMPAIGNS', style: TextStyle(color: Colors.white24, fontSize: 10, letterSpacing: 2)),
            ElevatedButton(onPressed: () {}, child: const Text('NEW AD', style: TextStyle(fontSize: 10))),
          ],
        ),
        const SizedBox(height: 20),
        Expanded(
          child: ListView.builder(
            itemCount: _ads.length,
            itemBuilder: (context, index) {
              final a = _ads[index];
              return ListTile(
                title: Text(a['name'], style: const TextStyle(color: Colors.white)),
                subtitle: Text("${a['placement']} - ${a['impressions']} IMP"),
                trailing: const Icon(Icons.edit, size: 16),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildNotificationsList() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('BROADCASTS', style: TextStyle(color: Colors.white24, fontSize: 10, letterSpacing: 2)),
            ElevatedButton(onPressed: () {}, child: const Text('NEW BROADCAST', style: TextStyle(fontSize: 10))),
          ],
        ),
        const SizedBox(height: 20),
        Expanded(
          child: ListView.builder(
            itemCount: _notifications.length,
            itemBuilder: (context, index) {
              final n = _notifications[index];
              return ListTile(
                title: Text(n['title'], style: const TextStyle(color: Colors.white)),
                subtitle: Text(n['target_type']),
                trailing: const Icon(Icons.delete, size: 16, color: Colors.red),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildOverridesList() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('SYSTEM OVERRIDES', style: TextStyle(color: Colors.white24, fontSize: 10, letterSpacing: 2)),
            ElevatedButton(onPressed: () { _resetForm(); _showOverrideForm(); }, child: const Text('NEW ENTRY', style: TextStyle(fontSize: 10))),
          ],
        ),
        const SizedBox(height: 20),
        Expanded(
          child: ListView.builder(
            itemCount: _overrides.length,
            itemBuilder: (context, index) => _buildOverrideItem(Map<String, dynamic>.from(_overrides[index])),
          ),
        ),
      ],
    );
  }

  Map<String, dynamic>? _selectedOverride;
  final _tmdbIdController = TextEditingController();
  final _urlController = TextEditingController();
  final _titleController = TextEditingController();
  String _mediaType = 'movie';

  @override
  void dispose() {
    _tmdbIdController.dispose();
    _urlController.dispose();
    _titleController.dispose();
    super.dispose();
  }

  void _resetForm() {
    _selectedOverride = null;
    _tmdbIdController.clear();
    _urlController.clear();
    _titleController.clear();
    _mediaType = 'movie';
  }

  void _editOverride(Map<String, dynamic> ov) {
    setState(() {
      _selectedOverride = ov;
      _tmdbIdController.text = ov['tmdb_id'].toString();
      _urlController.text = ov['video_url'];
      _titleController.text = ov['title'] ?? '';
      _mediaType = ov['media_type'];
    });
    // Scroll logic or just show modal
    _showOverrideForm();
  }

  void _duplicateOverride(Map<String, dynamic> ov) {
    setState(() {
      _selectedOverride = null;
      _tmdbIdController.text = ov['tmdb_id'].toString();
      _urlController.text = ov['video_url'];
      _titleController.text = ov['title'] != null ? "${ov['title']} (Copy)" : '';
      _mediaType = ov['media_type'];
    });
    _showOverrideForm();
  }

  void _showOverrideForm() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF0A0A0B),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: 40,
          right: 40,
          top: 40,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _selectedOverride == null ? 'SECURE NEW OVERRIDE' : 'MODIFY OVERRIDE',
              style: GoogleFonts.manrope(fontSize: 24, ),
            ),
            const SizedBox(height: 30),
            TextField(
              controller: _titleController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'TITLE (OPTIONAL)',
                labelStyle: TextStyle(color: Colors.white24, fontSize: 10, letterSpacing: 2),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white12)),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _tmdbIdController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(color: Colors.white),
                    decoration: const InputDecoration(
                      labelText: 'TMDB ID',
                      labelStyle: TextStyle(color: Colors.white24, fontSize: 10, letterSpacing: 2),
                      enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Colors.white12)),
                    ),
                  ),
                ),
                const SizedBox(width: 20),
                DropdownButton<String>(
                  value: _mediaType,
                  dropdownColor: const Color(0xFF1A1A1B),
                  items: ['movie', 'tv'].map((s) => DropdownMenuItem(value: s, child: Text(s.toUpperCase(), style: const TextStyle(fontSize: 12)))).toList(),
                  onChanged: (v) => setState(() => _mediaType = v!),
                ),
              ],
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _urlController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'SOURCE VIDEO URL',
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
                  padding: const EdgeInsets.symmetric(vertical: 20),
                ),
                onPressed: () async {
                  final api = ApiService();
                  final overrideData = {
                    'title': _titleController.text,
                    'tmdb_id': int.parse(_tmdbIdController.text),
                    'media_type': _mediaType,
                    'video_url': _urlController.text,
                    'id': _selectedOverride?['id'],
                  };
                  await api.adminSaveOverride("contactzerolord@gmail.com", overrideData);
                  Navigator.pop(context);
                  _fetchData();
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Override collection synchronized')));
                },
                child: Text(_selectedOverride == null ? 'SAVE TO VAULT' : 'UPDATE VAULT', style: const TextStyle(fontWeight: FontWeight.bold, letterSpacing: 2)),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

}
