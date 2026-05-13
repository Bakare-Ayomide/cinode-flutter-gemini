import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:picture_in_picture/picture_in_picture.dart';
import '../models/movie.dart';

class VideoPlayerScreen extends StatefulWidget {
  final Movie movie;
  final String url;
  final String userEmail;

  const VideoPlayerScreen({super.key, required this.movie, required this.url, required this.userEmail});

  @override
  State<VideoPlayerScreen> createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  late VideoPlayerController _videoPlayerController;
  final ApiService _apiService = ApiService();
  bool _showControls = true;
  bool _isBuffering = false;
  double _playbackSpeed = 1.0;
  double _volume = 1.0;
  bool _isMuted = false;
  bool _hasError = false;
  String _errorMessage = '';
  DateTime? _lastUpdate;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  Future<void> _initializePlayer() async {
    try {
      debugPrint("Initializing player for Cinode Link: ${widget.url}");
      final uri = Uri.parse(widget.url.replaceAll(' ', '%20'));
      if (widget.url.isEmpty) throw Exception("Source URL is empty");

      // Determine source
      if (widget.movie.localPath != null) {
        final file = File(widget.movie.localPath!);
        if (await file.exists()) {
          _videoPlayerController = VideoPlayerController.file(file);
        } else {
          _videoPlayerController = VideoPlayerController.networkUrl(uri);
        }
      } else {
        _videoPlayerController = VideoPlayerController.networkUrl(uri);
      }
      
      _videoPlayerController.addListener(() {
        if (mounted) {
          final position = _videoPlayerController.value.position;
          // Periodically update progress (every 3 seconds)
          if (_lastUpdate == null || DateTime.now().difference(_lastUpdate!) > const Duration(seconds: 3)) {
            _updateProgress();
          }

          setState(() {
            _isBuffering = _videoPlayerController.value.isBuffering;
            if (_videoPlayerController.value.hasError) {
              _hasError = true;
              final error = _videoPlayerController.value.errorDescription;
              _errorMessage = error ?? 'Playback error: Unsupported format or source lost.';
              debugPrint("CINODE_VIDEO_FAULT: $error | URL: ${widget.url}");
            }
          });
        }
      });

      await _videoPlayerController.initialize();
      
      // Seek to previous position if available
      if (widget.movie.playbackPosition != null && widget.movie.playbackPosition! > 5) {
         await Future.delayed(const Duration(milliseconds: 300));
         await _videoPlayerController.seekTo(Duration(seconds: widget.movie.playbackPosition!));
      }

      _videoPlayerController.setLooping(false);
      _videoPlayerController.play();
      
      // Auto-hide controls
      _resetControlTimer();

      SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);

      if (mounted) setState(() {});
    } catch (e) {
      debugPrint("CINODE_PLAYER_ERROR: $e");
      if (mounted) {
        setState(() {
          _hasError = true;
          _errorMessage = "Playback failed: Failed to load source.\nTechnical: ${e.toString()}";
        });
      }
    }
  }

  Future<void> _updateProgress() async {
    if (!_videoPlayerController.value.isInitialized) return;
    
    _lastUpdate = DateTime.now();
    await _apiService.addToHistory(
      widget.userEmail, 
      widget.movie,
      position: _videoPlayerController.value.position.inSeconds,
      duration: _videoPlayerController.value.duration.inSeconds,
    );
  }

  void _resetControlTimer() {
    Future.delayed(const Duration(seconds: 4), () {
      if (mounted && _videoPlayerController.value.isPlaying && _showControls) {
        setState(() => _showControls = false);
      }
    });
  }

  @override
  void dispose() {
    _updateProgress(); // Final update
    _videoPlayerController.dispose();
    SystemChrome.setPreferredOrientations([
      DeviceOrientation.portraitUp,
    ]);
    super.dispose();
  }

  void _toggleSpeed() {
    final speeds = [0.5, 1.0, 1.5, 2.0];
    int nextIdx = (speeds.indexOf(_playbackSpeed) + 1) % speeds.length;
    setState(() {
      _playbackSpeed = speeds[nextIdx];
      _videoPlayerController.setPlaybackSpeed(_playbackSpeed);
    });
  }

  void _togglePiP() {
    if (_videoPlayerController.value.isInitialized) {
        final pip = PictureInPicture();
        pip.requestPip(
            context,
            VideoPlayer(_videoPlayerController),
            onClose: () {
                _videoPlayerController.play();
            },
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      return Scaffold(
        backgroundColor: Colors.black,
        body: Stack(
          children: [
            Positioned(
              top: 40,
              left: 40,
              child: IconButton(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 24),
              ),
            ),
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, color: Colors.redAccent, size: 60),
                  const SizedBox(height: 16),
                  Text('CINODE LINK SEVERED', style: GoogleFonts.manrope(fontSize: 18, fontWeight: FontWeight.black, color: Colors.white, letterSpacing: 1)),
                  const SizedBox(height: 12),
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 40),
                    child: Text('The video format is not supported or the source is unavailable.', textAlign: TextAlign.center, style: TextStyle(color: Colors.redAccent, fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 40),
                    child: Text(_errorMessage, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white38, fontSize: 10, letterSpacing: 1)),
                  ),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: 280,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white, 
                        foregroundColor: Colors.black, 
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
                      ),
                      child: const Text('CANCEL & GO BACK', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: 280,
                    child: OutlinedButton(
                      onPressed: () {
                        setState(() {
                          _hasError = false;
                          _errorMessage = '';
                          _initializePlayer();
                        });
                      },
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Colors.white24),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
                      ),
                      child: const Text('RETRY CONNECTION', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );

    if (!_videoPlayerController.value.isInitialized) {
      return const Scaffold(
        backgroundColor: Colors.black,
        body: Center(child: CircularProgressIndicator(color: Colors.red)),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTap: () {
           setState(() => _showControls = !_showControls);
           if (_showControls) _resetControlTimer();
        },
        child: Stack(
          alignment: Alignment.center,
          children: [
            Center(
              child: AspectRatio(
                aspectRatio: _videoPlayerController.value.aspectRatio,
                child: VideoPlayer(_videoPlayerController),
              ),
            ),
            if (_isBuffering)
              const Center(child: CircularProgressIndicator(color: Colors.redAccent)),
            AnimatedOpacity(
              opacity: _showControls ? 1.0 : 0.0,
              duration: const Duration(milliseconds: 300),
              child: _showControls ? _buildControlsOverlay() : const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildControlsOverlay() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Colors.black.withOpacity(0.7), Colors.transparent, Colors.black.withOpacity(0.8)],
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 30),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                     Text(widget.movie.displayTitle, style: GoogleFonts.manrope(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: -1)),
                     const SizedBox(height: 4),
                     Row(
                       children: [
                         Container(
                           padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                           decoration: BoxDecoration(color: Colors.redAccent, borderRadius: BorderRadius.circular(2)),
                           child: const Text('4K HDR', style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.white)),
                         ),
                         const SizedBox(width: 8),
                         const Text('CINODE MASTER STREAM', style: TextStyle(fontSize: 8, letterSpacing: 2, color: Colors.white38, fontWeight: FontWeight.bold)),
                       ],
                     ),
                  ],
                ),
              ),
              Row(
                children: [
                  IconButton(
                    onPressed: _togglePiP,
                    icon: const Icon(Icons.picture_in_picture_alt, color: Colors.white60, size: 20),
                  ),
                  const SizedBox(width: 10),
                  IconButton(
                    onPressed: _toggleSpeed,
                    icon: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(border: Border.all(color: Colors.white24), borderRadius: BorderRadius.circular(4)),
                      child: Text('${_playbackSpeed}x', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ),
                  IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close, color: Colors.white, size: 28)),
                ],
              ),
            ],
          ),
          Column(
            children: [
              SliderTheme(
                data: SliderTheme.of(context).copyWith(
                  trackHeight: 2,
                  thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
                  overlayShape: const RoundSliderOverlayShape(overlayRadius: 10),
                  activeTrackColor: Colors.redAccent,
                  inactiveTrackColor: Colors.white10,
                  thumbColor: Colors.redAccent,
                ),
                child: Slider(
                  value: _videoPlayerController.value.position.inMilliseconds.toDouble(),
                  min: 0,
                  max: _videoPlayerController.value.duration.inMilliseconds.toDouble(),
                  onChanged: (v) {
                    _videoPlayerController.seekTo(Duration(milliseconds: v.toInt()));
                  },
                ),
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      IconButton(
                        icon: Icon(_videoPlayerController.value.isPlaying ? Icons.pause_circle_filled : Icons.play_circle_fill, size: 48, color: Colors.white),
                        onPressed: () {
                          setState(() {
                            _videoPlayerController.value.isPlaying
                                ? _videoPlayerController.pause()
                                : _videoPlayerController.play();
                          });
                        },
                      ),
                      const SizedBox(width: 20),
                      IconButton(
                        onPressed: () => _videoPlayerController.seekTo(_videoPlayerController.value.position - const Duration(seconds: 10)),
                        icon: const Icon(Icons.replay_10, color: Colors.white60),
                      ),
                      IconButton(
                        onPressed: () => _videoPlayerController.seekTo(_videoPlayerController.value.position + const Duration(seconds: 10)),
                        icon: const Icon(Icons.forward_10, color: Colors.white60),
                      ),
                      const SizedBox(width: 20),
                      IconButton(
                        icon: Icon(_isMuted ? Icons.volume_off : Icons.volume_up, color: Colors.white60),
                        onPressed: () {
                          setState(() {
                            _isMuted = !_isMuted;
                            _videoPlayerController.setVolume(_isMuted ? 0 : _volume);
                          });
                        },
                      ),
                    ],
                  ),
                  Text(
                    '${_formatDuration(_videoPlayerController.value.position)} / ${_formatDuration(_videoPlayerController.value.duration)}',
                    style: GoogleFonts.manrope(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white38),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return "$minutes:$seconds";
  }
}
