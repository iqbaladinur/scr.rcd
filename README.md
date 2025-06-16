<p align="center">
  <img src="https://raw.githubusercontent.com/iqbaladinur/scr.rcd/master/public/logo-tone.png" alt="scr.rcd logo">
</p>

#
SCR.RCD is a web-based screen recording application that allows users to record their screens directly in the browser. Unlike traditional screen recording tools that save recordings on servers, SCR.RCD stores recorded videos locally on the client-side using IndexedDB, ensuring user privacy and security.

![scr.rcd preview](https://raw.githubusercontent.com/iqbaladinur/scr.rcd/master/preview/preview.png)

## Features Roadmaps

- [x] **Browser-based:** SCR.RCD is entirely browser-based, eliminating the need for users to install additional software or plugins.
- [x] **Screen Recording:** Record your screen with ease directly within your browser window.
- [x] **Local Storage:** Recorded videos are stored locally on the client-side using IndexedDB, providing enhanced privacy and security.
- [x] **Simple Interface:** The user interface is intuitive and easy to use, making screen recording accessible to everyone.
- [x] **CameraView:** Enable camera view (currently using [PiP](https://developer.mozilla.org/en-US/docs/Web/API/Picture-in-Picture_API), only recorded if the user select capture entire screen).
- [x] **Video Cutter:** Added ability to trim video in mp4 format. 
- [x] **Customizable Settings:** Customize recording settings such as frame rate, resolution, and audio options.
- [x] **Multi-Resolution Support:** Choose from various resolutions including Auto, HD (720p), Full HD (1080p), 2K, 4K, and Maximum.
- [x] **Advanced Bitrate Control:** Select between Auto, High Quality (8 Mbps video + 256 Kbps audio), and Ultra Quality (15 Mbps video + 320 Kbps audio).
- [x] **Codec Optimization:** Support for VP9, VP8, and H.264 with auto-detection of the best supported codec.
- [x] **Advanced Video Mode:** Enhanced video constraints with aspect ratio optimization and improved recording quality.
- [x] **Auto-Optimization:** Smart device capability detection and automatic application of optimal settings.
- [x] **Enhanced Audio Quality:** CD quality audio (44.1 kHz) with improved bitrate and echo cancellation.
- [x] **Quality Information Display:** Real-time display of active recording quality settings.
- [x] **Playback Speed Control:** Adjust video playback rates in both VideoCutter and VideoPlayer components.
- [ ] whats next ...?

## Development

### Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

### Recommended Setup

- [VS Code](https://code.visualstudio.com/) + [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (previously Volar) and disable Vetur

- Use [vue-tsc](https://github.com/vuejs/language-tools/tree/master/packages/tsc) for performing the same type checking from the command line, or for generating d.ts files for SFCs.

### Reusable Components

- see [here](https://www.shadcn-vue.com/docs/introduction.html)

To get started with SCR.RCD, follow these steps:

1. Clone the repository: `git clone https://github.com/iqbaladinur/scr.rcd.git`
2. run ```npm install``` inside scr.rcd directory
3. run ```npm run dev``` to start local development

## Compatibility

SCR.RCD is compatible with modern web browsers that support the necessary APIs for screen recording and IndexedDB storage. We recommend using the latest versions of browsers such as Google Chrome, Mozilla Firefox, or Microsoft Edge for the best experience.

## Contributing

We welcome contributions from the community to improve SCR.RCD. If you'd like to contribute, please follow these guidelines:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/my-feature`.
3. Make your changes and commit them: `git commit -am 'Add new feature'`.
4. Push to the branch: `git push origin feature/my-feature`.
5. Submit a pull request.

Please ensure that your code adheres to our coding standards and includes appropriate documentation for any new features or changes.

## Support

If you encounter any issues or have any questions about SCR.RCD, please feel free to [open an issue](https://github.com/iqbaladinur/scr.rcd/issues) on GitHub, and we'll be happy to assist you.

## License
This app is open-sourced software licensed under the [MIT LICENSE](https://raw.githubusercontent.com/iqbaladinur/scr.rcd/master/LICENSE).