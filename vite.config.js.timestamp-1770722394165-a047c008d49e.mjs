// vite.config.js
import { defineConfig } from "file:///E:/Cards/node_modules/vite/dist/node/index.js";
import react from "file:///E:/Cards/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    fs: {
      max: Infinity
    },
    host: true,
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    }
  },
  publicDir: "public",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Critical chunks for initial load
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          // Defer heavy libraries
          "ui-heavy": ["framer-motion", "lucide-react"],
          "animation": ["gsap", "lottie-react"],
          "firebase": ["firebase/app", "firebase/auth", "firebase/firestore"],
          "utils": ["axios", "html2canvas", "canvas-confetti", "use-sound", "uuid"],
          "toast": ["react-hot-toast"]
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split("/").pop() : "chunk";
          return `js/[name]-[hash].js`;
        }
      }
    },
    chunkSizeWarningLimit: 1e3,
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      mangle: true
    },
    sourcemap: false,
    target: "es2015",
    cssCodeSplit: true,
    copyPublicDir: true
  },
  optimizeDeps: {
    // Defer heavy dependencies
    exclude: [
      "@firebase/util",
      "firebase/app",
      "firebase/auth",
      "firebase/firestore",
      "framer-motion",
      "motion-utils",
      "motion-dom",
      "gsap",
      "canvas-confetti",
      "use-sound"
    ],
    // Include only critical dependencies
    include: ["react", "react-dom", "react-router-dom"]
  },
  // Ensure Firebase Auth routes work in production
  preview: {
    port: 4173,
    host: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxDYXJkc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcQ2FyZHNcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L0NhcmRzL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcblxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHNlcnZlcjoge1xuICAgIGZzOiB7XG4gICAgICBtYXg6IEluZmluaXR5XG4gICAgfSxcbiAgICBob3N0OiB0cnVlLFxuICAgIHBvcnQ6IDUxNzMsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBobXI6IHtcbiAgICAgIHBvcnQ6IDUxNzNcbiAgICB9XG4gIH0sXG4gIHB1YmxpY0RpcjogJ3B1YmxpYycsXG4gIGJ1aWxkOiB7XG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgb3V0cHV0OiB7XG4gICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgIC8vIENyaXRpY2FsIGNodW5rcyBmb3IgaW5pdGlhbCBsb2FkXG4gICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbSddLFxuICAgICAgICAgIHJvdXRlcjogWydyZWFjdC1yb3V0ZXItZG9tJ10sXG5cbiAgICAgICAgICAvLyBEZWZlciBoZWF2eSBsaWJyYXJpZXNcbiAgICAgICAgICAndWktaGVhdnknOiBbJ2ZyYW1lci1tb3Rpb24nLCAnbHVjaWRlLXJlYWN0J10sXG4gICAgICAgICAgJ2FuaW1hdGlvbic6IFsnZ3NhcCcsICdsb3R0aWUtcmVhY3QnXSxcbiAgICAgICAgICAnZmlyZWJhc2UnOiBbJ2ZpcmViYXNlL2FwcCcsICdmaXJlYmFzZS9hdXRoJywgJ2ZpcmViYXNlL2ZpcmVzdG9yZSddLFxuICAgICAgICAgICd1dGlscyc6IFsnYXhpb3MnLCAnaHRtbDJjYW52YXMnLCAnY2FudmFzLWNvbmZldHRpJywgJ3VzZS1zb3VuZCcsICd1dWlkJ10sXG4gICAgICAgICAgJ3RvYXN0JzogWydyZWFjdC1ob3QtdG9hc3QnXVxuICAgICAgICB9LFxuICAgICAgICBjaHVua0ZpbGVOYW1lczogKGNodW5rSW5mbykgPT4ge1xuICAgICAgICAgIGNvbnN0IGZhY2FkZU1vZHVsZUlkID0gY2h1bmtJbmZvLmZhY2FkZU1vZHVsZUlkID8gY2h1bmtJbmZvLmZhY2FkZU1vZHVsZUlkLnNwbGl0KCcvJykucG9wKCkgOiAnY2h1bmsnO1xuICAgICAgICAgIHJldHVybiBganMvW25hbWVdLVtoYXNoXS5qc2A7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LFxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcbiAgICBtaW5pZnk6ICd0ZXJzZXInLFxuICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSxcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBtYW5nbGU6IHRydWUsXG4gICAgfSxcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIHRhcmdldDogJ2VzMjAxNScsXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxuICAgIGNvcHlQdWJsaWNEaXI6IHRydWVcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgLy8gRGVmZXIgaGVhdnkgZGVwZW5kZW5jaWVzXG4gICAgZXhjbHVkZTogW1xuICAgICAgJ0BmaXJlYmFzZS91dGlsJyxcbiAgICAgICdmaXJlYmFzZS9hcHAnLFxuICAgICAgJ2ZpcmViYXNlL2F1dGgnLFxuICAgICAgJ2ZpcmViYXNlL2ZpcmVzdG9yZScsXG4gICAgICAnZnJhbWVyLW1vdGlvbicsXG4gICAgICAnbW90aW9uLXV0aWxzJyxcbiAgICAgICdtb3Rpb24tZG9tJyxcbiAgICAgICdnc2FwJyxcbiAgICAgICdjYW52YXMtY29uZmV0dGknLFxuICAgICAgJ3VzZS1zb3VuZCdcbiAgICBdLFxuICAgIC8vIEluY2x1ZGUgb25seSBjcml0aWNhbCBkZXBlbmRlbmNpZXNcbiAgICBpbmNsdWRlOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ11cbiAgfSxcbiAgLy8gRW5zdXJlIEZpcmViYXNlIEF1dGggcm91dGVzIHdvcmsgaW4gcHJvZHVjdGlvblxuICBwcmV2aWV3OiB7XG4gICAgcG9ydDogNDE3MyxcbiAgICBob3N0OiB0cnVlXG4gIH1cbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQThNLFNBQVMsb0JBQW9CO0FBQzNPLE9BQU8sV0FBVztBQUdsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsUUFBUTtBQUFBLElBQ04sSUFBSTtBQUFBLE1BQ0YsS0FBSztBQUFBLElBQ1A7QUFBQSxJQUNBLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFlBQVk7QUFBQSxJQUNaLEtBQUs7QUFBQSxNQUNILE1BQU07QUFBQSxJQUNSO0FBQUEsRUFDRjtBQUFBLEVBQ0EsV0FBVztBQUFBLEVBQ1gsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBO0FBQUEsVUFFWixRQUFRLENBQUMsU0FBUyxXQUFXO0FBQUEsVUFDN0IsUUFBUSxDQUFDLGtCQUFrQjtBQUFBO0FBQUEsVUFHM0IsWUFBWSxDQUFDLGlCQUFpQixjQUFjO0FBQUEsVUFDNUMsYUFBYSxDQUFDLFFBQVEsY0FBYztBQUFBLFVBQ3BDLFlBQVksQ0FBQyxnQkFBZ0IsaUJBQWlCLG9CQUFvQjtBQUFBLFVBQ2xFLFNBQVMsQ0FBQyxTQUFTLGVBQWUsbUJBQW1CLGFBQWEsTUFBTTtBQUFBLFVBQ3hFLFNBQVMsQ0FBQyxpQkFBaUI7QUFBQSxRQUM3QjtBQUFBLFFBQ0EsZ0JBQWdCLENBQUMsY0FBYztBQUM3QixnQkFBTSxpQkFBaUIsVUFBVSxpQkFBaUIsVUFBVSxlQUFlLE1BQU0sR0FBRyxFQUFFLElBQUksSUFBSTtBQUM5RixpQkFBTztBQUFBLFFBQ1Q7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsdUJBQXVCO0FBQUEsSUFDdkIsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsZUFBZTtBQUFBLE1BQ2pCO0FBQUEsTUFDQSxRQUFRO0FBQUEsSUFDVjtBQUFBLElBQ0EsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLElBQ1IsY0FBYztBQUFBLElBQ2QsZUFBZTtBQUFBLEVBQ2pCO0FBQUEsRUFDQSxjQUFjO0FBQUE7QUFBQSxJQUVaLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFFQSxTQUFTLENBQUMsU0FBUyxhQUFhLGtCQUFrQjtBQUFBLEVBQ3BEO0FBQUE7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
