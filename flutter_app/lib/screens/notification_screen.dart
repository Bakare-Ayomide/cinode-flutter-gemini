import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';

class NotificationScreen extends StatefulWidget {
  final String userEmail;
  const NotificationScreen({super.key, required this.userEmail});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  List<dynamic> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    final data = await ApiService().getNotifications(widget.userEmail);
    if (mounted) {
      setState(() {
        _notifications = data;
        _isLoading = false;
      });
    }
  }

  Future<void> _markRead(int id) async {
    await ApiService().markNotificationAsRead(widget.userEmail, id);
    _loadNotifications();
  }

  Future<void> _markAllRead() async {
    await ApiService().markAllNotificationsAsRead(widget.userEmail);
    _loadNotifications();
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
            Text('ARCHIVE TERMINAL', style: GoogleFonts.manrope(fontSize: 12, letterSpacing: 3, fontWeight: FontWeight.black,  color: Colors.white70)),
            Text('${_notifications.where((n) => n['is_read'] == 0).length} UNREAD ENTRIES', style: GoogleFonts.manrope(fontSize: 7, letterSpacing: 2, color: Colors.white24, fontWeight: FontWeight.black)),
          ],
        ),
        actions: [
          if (_notifications.any((n) => n['is_read'] == 0))
            Padding(
              padding: const EdgeInsets.only(right: 10),
              child: TextButton(
                onPressed: _markAllRead,
                style: TextButton.styleFrom(
                  backgroundColor: Colors.redAccent.withOpacity(0.1),
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('PURGE UNREAD', style: TextStyle(color: Colors.redAccent, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 1)),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Colors.red, strokeWidth: 2))
          : _notifications.isEmpty
              ? _buildEmptyState()
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  itemCount: _notifications.length,
                  itemBuilder: (context, index) {
                    final n = _notifications[index];
                    final isRead = n['is_read'] == 1;
                    return _buildNotificationItem(n, isRead);
                  },
                ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.01),
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: const Icon(Icons.notifications_none, size: 32, color: Colors.white10),
          ),
          const SizedBox(height: 24),
          Text('ZERO ACTIVITY', style: GoogleFonts.manrope(fontWeight: FontWeight.black, fontSize: 10, letterSpacing: 4, color: Colors.white10)),
          const SizedBox(height: 8),
          Text('SYSTEM LOGS ARE CLEAR', style: GoogleFonts.manrope(color: Colors.white.withOpacity(0.05), fontSize: 8, letterSpacing: 2, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  void _showNotificationDetail(Map<String, dynamic> n) {
    if (n['is_read'] == 0) _markRead(n['id']);
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.7,
        decoration: const BoxDecoration(
          color: Color(0xFF0D0D0E),
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
          border: Border(top: BorderSide(color: Colors.white10)),
        ),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40, height: 4,
              decoration: BoxDecoration(color: Colors.white12, borderRadius: BorderRadius.circular(2)),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(32),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.redAccent.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(Icons.security, color: Colors.redAccent, size: 20),
                        ),
                        const SizedBox(width: 16),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('SIGNAL INTERCEPT', style: GoogleFonts.manrope(fontSize: 10, letterSpacing: 2, fontWeight: FontWeight.black, color: Colors.white38)),
                            Text('PRIORITY: ${n['type']?.toString().toUpperCase()}', style: GoogleFonts.manrope(fontSize: 7, letterSpacing: 1, fontWeight: FontWeight.black, color: Colors.white10)),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),
                    Text(
                      n['title'].toString().toUpperCase(),
                      style: GoogleFonts.manrope(
                        fontSize: 24,
                        fontWeight: FontWeight.black,
                        color: Colors.white,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Container(width: 20, height: 1, color: Colors.white10),
                        const SizedBox(width: 12),
                        Text(
                          n['created_at'].toString().replaceFirst('T', ' ').split('.')[0],
                          style: GoogleFonts.manrope(color: Colors.white24, fontSize: 8, fontWeight: FontWeight.black, letterSpacing: 1),
                        ),
                      ],
                    ),
                    const SizedBox(height: 48),
                    Text(
                      n['message'],
                      style: GoogleFonts.manrope(
                        color: Colors.white70,
                        fontSize: 14,
                        height: 1.8,
                        fontWeight: FontWeight.w300,
                      ),
                    ),
                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: SizedBox(
                width: double.infinity,
                height: 64,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: Text('CONFIRM AWARENESS', style: GoogleFonts.manrope(fontSize: 11, fontWeight: FontWeight.black, letterSpacing: 2)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNotificationItem(Map<String, dynamic> n, bool isRead) {
    IconData iconData = Icons.info_outline;
    Color iconColor = Colors.white24;
    if (n['type'] == 'success') { iconData = Icons.check_circle_outline; iconColor = Colors.green; }
    if (n['type'] == 'warning') { iconData = Icons.warning_amber_outlined; iconColor = Colors.orange; }
    if (n['type'] == 'error') { iconData = Icons.error_outline; iconColor = Colors.red; }

    return GestureDetector(
      onTap: () => _showNotificationDetail(n),
      child: Container(
        margin: const EdgeInsets.only(bottom: 2),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isRead ? Colors.transparent : Colors.white.withOpacity(0.02),
          border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.03))),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isRead ? Colors.white.withOpacity(0.03) : iconColor.withOpacity(0.1), 
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              child: Icon(iconData, color: isRead ? Colors.white10 : iconColor, size: 16),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          n['title'].toString().toUpperCase(), 
                          style: GoogleFonts.manrope(
                            fontWeight: FontWeight.black, 
                            fontSize: 11, 
                            letterSpacing: 1,
                            color: isRead ? Colors.white24 : Colors.white70,
                          ),
                        ),
                      ),
                      if (!isRead)
                        Container(
                          margin: const EdgeInsets.only(top: 4, left: 8),
                          width: 4, height: 4,
                          decoration: const BoxDecoration(color: Colors.redAccent, shape: BoxShape.circle, boxShadow: [BoxShadow(color: Colors.redAccent, blurRadius: 8)]),
                        ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(n['message'], style: TextStyle(color: isRead ? Colors.white10 : Colors.white38, fontSize: 10, height: 1.5)),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Container(width: 12, height: 1, color: Colors.white10),
                      const SizedBox(width: 8),
                      Text(
                        n['created_at'].toString().split('T')[0], 
                        style: GoogleFonts.manrope(color: Colors.white.withOpacity(0.03), fontSize: 7, fontWeight: FontWeight.black, letterSpacing: 1),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
