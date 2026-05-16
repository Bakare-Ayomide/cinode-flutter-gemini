import 'dart:io';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:picture_in_picture/picture_in_picture.dart';
import 'package:provider/provider.dart';
import '../models/movie.dart';
import '../services/api_service.dart';

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
  bool _showControls = true;
  bool _isBuffering = false;
  double _playbackSpeed = 1.0;
  double _volume = 1.0;
  bool _isMuted = false;
  Timer? _progressTimer;
  double? _resumeTime;
  bool _showResumePrompt = false;

  @override
  void initState() {
    super.initState();
    _initializePlayer();
  }

  Future<void> _initializePlayer() async {
    if (widget.movie.localPath != null) {
      final file = File(widget.movie.localPath!);
      if (await file.exists()) {
        _videoPlayerController = VideoPlayerController.file(file);
      } else {
        _videoPlayerController = VideoPlayerController.networkUrl(Uri.parse(widget.url.replaceAll(' ', '%20')));
      }
    } else {
      _videoPlayerController = VideoPlayerController.networkUrl(Uri.parse(widget.url.replaceAll(' ', '%20')));
    }
    
    _videoPlayerController.addListener(() {
      if (mounted) {
        setState(() {
          _isBuffering = _videoPlayerController.value.isBuffering;
        });
      }
    });

    await _videoPlayerController.initialize();
    
    // Check for progress
    final api = context.read<ApiService>();
    final progress = await api.getPlaybackProgress(widget.userEmail, widget.movie.mediaType, widget.movie.id.toString());
    
    if (mounted) {
      double savedTime = (progress['progress_time'] ?? 0.0).toDouble();
      if (savedTime > 10) {
        setState(() {
          _resumeTime = savedTime;
          _showResumePrompt = true;
        });
      } else {
        _startPlayback();
      }
    }
  }

  void _startPlayback() {
    _videoPlayerController.setLooping(false);
    _videoPlayerController.play();
    
    // Periodic save
    _progressTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      _saveProgress();
    });

    _resetControlTimer();

    setState(() {});
  }

  void _saveProgress() {
    if (!_videoPlayerController.value.isInitialized) return;
    final api = context.read<ApiService>();
    api.savePlaybackProgress(widget.userEmail, {
      'movie_id': widget.movie.id,
      'media_type': widget.movie.mediaType,
      'title': widget.movie.displayTitle,
      'poster_path': widget.movie.posterPath,
      'progress_time': _videoPlayerController.value.position.inSeconds.toDouble(),
      'duration': _videoPlayerController.value.duration.inSeconds.toDouble(),
    });
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
    _progressTimer?.cancel();
    _saveProgress();
    _videoPlayerController.dispose();
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
            if (_showResumePrompt && _resumeTime != null)
              _buildResumeOverlay(),
          ],
        ),
      ),
    );
  }

  Widget _buildResumeOverlay() {
    return Container(
      color: Colors.black54,
      child: Center(
        child: Container(
          width: 350,
          padding: const EdgeInsets.all(30),
          decoration: BoxDecoration(
            color: const Color(0xFF0D0D0E),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white10),
            boxShadow: [
              BoxShadow(color: Colors.black54, blurRadius: 20, spreadRadius: 5),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: Colors.redAccent.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.redAccent.withOpacity(0.2)),
                ),
                child: const Icon(Icons.play_lesson_outlined, color: Colors.redAccent, size: 40),
              ),
              const SizedBox(height: 20),
              Text('RESUME PROGRESS?', style: GoogleFonts.manrope(fontSize: 20, fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: -0.5)),
              const SizedBox(height: 8),
              Text('You left off at ${_formatDuration(Duration(seconds: _resumeTime!.toInt()))}', style: const TextStyle(color: Colors.white38, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
              const SizedBox(height: 30),
              Column(
                children: [
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.redAccent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      onPressed: () async {
                        await _videoPlayerController.seekTo(Duration(seconds: _resumeTime!.toInt()));
                        setState(() => _showResumePrompt = false);
                        _startPlayback();
                      },
                      child: const Text('RESUME VIEWING', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 1)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: TextButton(
                      style: TextButton.styleFrom(
                        backgroundColor: Colors.white.withOpacity(0.05),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      onPressed: () {
                        setState(() => _showResumePrompt = false);
                        _startPlayback();
                      },
                      child: const Text('START FROM BEGINNING', style: TextStyle(color: Colors.white38, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1)),
                    ),
                  ),
                ],
              ),
            ],
          ),
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
