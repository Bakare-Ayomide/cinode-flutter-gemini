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
  List<dynamic> _jellyfinServers = [];
  List<dynamic> _settings = [];
  Map<String, dynamic> _payConfig = {};
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
    const user = "contactzerolord@gmail.com";
    
    try {
      final results = await Future.wait([
        api.getAdminOverrides(user),
        api.getAdminPayments(user),
        api.getAdminAffiliates(user),
        api.getAdminAds(user),
        api.getAdminNotifications(user),
        api.getAdminUsers(user),
        api.getAdminJellyfinServers(user),
        api.getAdminSettings(user),
        api.getAdminPaymentConfig(user),
        api.getAdminStats(user),
      ]);

      if (mounted) {
        setState(() {
          _overrides = results[0];
          _payments = results[1];
          _affiliates = results[2];
          _ads = results[3];
          _notifications = results[4];
          _users = results[5];
          _jellyfinServers = results[6];
          _settings = results[7];
          _payConfig = results[8] as Map<String, dynamic>;
          _stats = results[9] as Map<String, dynamic>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) return const Scaffold(backgroundColor: Color(0xFF0A0A0B), body: Center(child: CircularProgressIndicator(color: Colors.red)));

    final isWide = MediaQuery.of(context).size.width > 900;

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0B),
      body: Padding(
        padding: EdgeInsets.all(isWide ? 40.0 : 20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!isWide) const SizedBox(height: 20),
            Text(
              'CONTROL CENTER',
              style: GoogleFonts.manrope(
                fontSize: isWide ? 64 : 32,
                fontWeight: FontWeight.w300,
                color: Colors.white,
                letterSpacing: -1,
              ),
            ),
            const SizedBox(height: 20),
            _buildTabSwitcher(),
            const SizedBox(height: 20),
            Expanded(child: _buildActiveContent()),
          ],
        ),
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
          _buildTabButton('VAULT', 'overrides'),
          _buildTabButton('CONFIG', 'settings'),
          _buildTabButton('PAYMENTS', 'payments'),
          _buildTabButton('CHECKOUT', 'payconfig'),
          _buildTabButton('PARTNERS', 'affiliates'),
          _buildTabButton('ADS', 'ads'),
          _buildTabButton('NOTIFS', 'notifications'),
          _buildTabButton('SERVERS', 'jellyfin'),
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
      case 'payconfig': return _buildPayConfig();
      case 'affiliates': return _buildAffiliatesList();
      case 'ads': return _buildAdsList();
      case 'notifications': return _buildNotificationsList();
      case 'overrides': return _buildOverridesList();
      case 'settings': return _buildSettingsList();
      case 'jellyfin': return _buildJellyfinList();
      default: return _buildStatsDashboard();
    }
  }

  Widget _buildSettingsList() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('REGISTRY', style: TextStyle(color: Colors.white24, fontSize: 10, letterSpacing: 2)),
            ElevatedButton(onPressed: _showSettingsForm, child: const Text('NEW ENTRY', style: TextStyle(fontSize: 10))),
          ],
        ),
        const SizedBox(height: 20),
        Expanded(
          child: GridView.builder(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 2.5,
              crossAxisSpacing: 20,
              mainAxisSpacing: 20,
            ),
            itemCount: _settings.length,
            itemBuilder: (context, index) {
              final s = _settings[index];
              return Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.02),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white10),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(s['setting_key'], style: const TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
                    const SizedBox(height: 5),
                    Text(s['setting_value'].toString(), maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white60, fontSize: 12)),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _showSettingsForm() {
    final keyController = TextEditingController();
    final valController = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF151517),
        title: const Text('NEW CONFIG ENTRY'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: keyController, decoration: const InputDecoration(labelText: 'KEY')),
            TextField(controller: valController, decoration: const InputDecoration(labelText: 'VALUE'), maxLines: 3),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('CANCEL')),
          TextButton(onPressed: () async {
            await ApiService().saveAdminSetting("contactzerolord@gmail.com", keyController.text, valController.text);
            Navigator.pop(context);
            _fetchData();
          }, child: const Text('SAVE')),
        ],
      ),
    );
  }

  Widget _buildPayConfig() {
    final controllers = {
      'bank_name': TextEditingController(text: _payConfig['bank_name']),
      'account_name': TextEditingController(text: _payConfig['account_name']),
      'account_number': TextEditingController(text: _payConfig['account_number']),
      'crypto_address': TextEditingController(text: _payConfig['crypto_address']),
      'other_method': TextEditingController(text: _payConfig['other_method']),
      'payment_note': TextEditingController(text: _payConfig['payment_note']),
    };

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('PAYMENT INFRASTRUCTURE', style: TextStyle(color: Colors.white24, fontSize: 10, letterSpacing: 2)),
              ElevatedButton(
                onPressed: () async {
                  final data = controllers.map((k, v) => MapEntry(k, v.text));
                  await ApiService().saveAdminPaymentConfig("contactzerolord@gmail.com", data);
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Config updated')));
                  _fetchData();
                },
                child: const Text('SAVE CHANGES', style: TextStyle(fontSize: 10)),
              ),
            ],
          ),
          const SizedBox(height: 30),
          _buildConfigCard('BANK TRANSFER', [
            _buildConfigField('BANK NAME', controllers['bank_name']!),
            _buildConfigField('ACCOUNT NAME', controllers['account_name']!),
            _buildConfigField('ACCOUNT NUMBER', controllers['account_number']!),
          ]),
          const SizedBox(height: 20),
          _buildConfigCard('ALTERNATIVE METHODS', [
            _buildConfigField('CRYPTO ADDRESS', controllers['crypto_address']!),
            _buildConfigField('OTHER / MOBILE MONEY', controllers['other_method']!, maxLines: 3),
          ]),
          const SizedBox(height: 20),
          _buildConfigCard('USER BANNER', [
            _buildConfigField('CHECKOUT NOTE', controllers['payment_note']!, maxLines: 3),
          ]),
        ],
      ),
    );
  }

  Widget _buildConfigCard(String title, List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(30),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Colors.white24, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 2)),
          const SizedBox(height: 20),
          ...children,
        ],
      ),
    );
  }

  Widget _buildConfigField(String label, TextEditingController controller, {int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        style: const TextStyle(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(color: Colors.white24, fontSize: 10),
          enabledBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.white10)),
          focusedBorder: const UnderlineInputBorder(borderSide: BorderSide(color: Colors.redAccent)),
        ),
      ),
    );
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
                subtitle: Text(n['target_type'], style: const TextStyle(color: Colors.white24, fontSize: 10)),
                trailing: IconButton(
                  icon: const Icon(Icons.delete, size: 16, color: Colors.red),
                  onPressed: () => _handleDeleteNotification(n['id']),
                ),
                onTap: () => _showAdminNotificationDetail(n),
              );
            },
          ),
        ),
      ],
    );
  }

  void _showAdminNotificationDetail(Map<String, dynamic> n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF0D0D0E),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text(n['title'].toString().toUpperCase(), style: GoogleFonts.manrope(fontWeight: FontWeight.black, color: Colors.white, fontSize: 18)),
        content: SizedBox(
          width: 400,
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('TARGET: ${n['target_type']?.toString().toUpperCase()}', style: const TextStyle(color: Colors.redAccent, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                const SizedBox(height: 16),
                Text(n['message'] ?? '', style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.6)),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('CLOSE', style: TextStyle(color: Colors.white38, fontWeight: FontWeight.bold))),
        ],
      ),
    );
  }

  Future<void> _handleDeleteNotification(int id) async {
    final api = ApiService();
    final adminEmail = "contactzerolord@gmail.com";
    try {
      await api.deleteAdminNotification(adminEmail, id);
      _fetchData();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Delete failed')));
    }
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

  Widget _buildOverrideItem(Map<String, dynamic> ov) {
    return ListTile(
      title: Text(ov['title'] ?? 'TMDB ID: ${ov['tmdb_id']}', style: const TextStyle(color: Colors.white)),
      subtitle: Text("${ov['media_type'].toString().toUpperCase()} - ${ov['video_url']}", style: const TextStyle(color: Colors.white24, fontSize: 10)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(icon: const Icon(Icons.copy, size: 16, color: Colors.blue), onPressed: () => _duplicateOverride(ov)),
          IconButton(icon: const Icon(Icons.edit, size: 16, color: Colors.white38), onPressed: () => _editOverride(ov)),
          IconButton(icon: const Icon(Icons.delete, size: 16, color: Colors.redAccent), onPressed: () => _handleDeleteOverride(ov['id'])),
        ],
      ),
    );
  }

  Future<void> _handleDeleteOverride(int id) async {
    await ApiService().adminDeleteOverride("contactzerolord@gmail.com", id);
    _fetchData();
  }

  Widget _buildJellyfinList() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('JELLYFIN INFRASTRUCTURE', style: TextStyle(color: Colors.white24, fontSize: 10, letterSpacing: 2)),
            ElevatedButton(onPressed: _showJellyfinForm, child: const Text('ADD SERVER', style: TextStyle(fontSize: 10))),
          ],
        ),
        const SizedBox(height: 20),
        Expanded(
          child: ListView.builder(
            itemCount: _jellyfinServers.length,
            itemBuilder: (context, index) {
              final s = _jellyfinServers[index];
              return ListTile(
                title: Text(s['name'], style: const TextStyle(color: Colors.white)),
                subtitle: Text(s['url'], style: const TextStyle(color: Colors.white24, fontSize: 10)),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Switch(value: s['is_active'] == 1, onChanged: (v) async {
                      s['is_active'] = v ? 1 : 0;
                      await ApiService().saveAdminJellyfinServer("contactzerolord@gmail.com", s);
                      _fetchData();
                    }),
                    IconButton(
                      icon: const Icon(Icons.delete, size: 16, color: Colors.red),
                      onPressed: () async {
                        await ApiService().deleteAdminJellyfinServer("contactzerolord@gmail.com", s['id']);
                        _fetchData();
                      },
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _showJellyfinForm() {
    final nameController = TextEditingController();
    final urlController = TextEditingController();
    final keyController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF151517),
        title: const Text('ADD JELLYFIN SERVER'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameController, decoration: const InputDecoration(labelText: 'NAME')),
            TextField(controller: urlController, decoration: const InputDecoration(labelText: 'URL (with http/https)')),
            TextField(controller: keyController, decoration: const InputDecoration(labelText: 'API KEY')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('CANCEL')),
          TextButton(
            onPressed: () async {
              await ApiService().saveAdminJellyfinServer("contactzerolord@gmail.com", {
                'name': nameController.text,
                'url': urlController.text,
                'api_key': keyController.text,
                'is_active': 1,
              });
              Navigator.pop(context);
              _fetchData();
            },
            child: const Text('SAVE'),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String label, String value, {Color color = Colors.redAccent}) {
    return Container(
      width: 200,
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: Colors.white24, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 2)),
          const SizedBox(height: 15),
          Text(value, style: GoogleFonts.manrope(fontSize: 32, fontWeight: FontWeight.bold, color: color)),
        ],
      ),
    );
  }

  Widget _buildSettingsPanel() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(30),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.01),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('SYSTEM CONFIGURATION', style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.black, color: Colors.white38, letterSpacing: 2)),
          const SizedBox(height: 30),
          _buildToggleSetting('MAINTENANCE MODE', false),
          _buildToggleSetting('ALLOW NEW REGISTRATIONS', true),
          _buildToggleSetting('ENFORCE PREMIUM FOR HLS', true),
        ],
      ),
    );
  }

  Widget _buildToggleSetting(String label, bool value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.bold)),
          Switch(value: value, onChanged: (v) {}, activeColor: Colors.redAccent),
        ],
      ),
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
