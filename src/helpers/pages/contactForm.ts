export const contactForm = () => {
  return `
    <html>
      <head>
        <title>Contact Us</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          .modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; }
          .modal.active { display: flex; }
        </style>
      </head>
      <body class="bg-gray-300 min-h-screen flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-black mb-6">Welcome to NEC Group</h1>
          <button onclick="openModal()" class="px-6 py-3 rounded-xl bg-white text-indigo-600 font-semibold shadow hover:scale-105 transition">
            Contact Us
          </button>
        </div>

        <!-- Modal -->
        <div id="contactModal" class="modal">
          <div class="bg-white rounded-2xl shadow-lg w-96 p-6 relative">
            <button onclick="closeModal()" class="absolute top-3 right-3 text-gray-500 hover:text-gray-800">✖</button>
            <h2 class="text-2xl font-semibold text-gray-800 mb-4">Send us a message</h2>
            <form method="POST" action="/contact" class="space-y-4">
              <input type="text" name="name" placeholder="Your Name" required class="w-full p-3 border rounded-xl focus:ring focus:ring-indigo-300 outline-none"/>
              <input type="email" name="email" placeholder="Your Email" required class="w-full p-3 border rounded-xl focus:ring focus:ring-indigo-300 outline-none"/>
              <textarea name="message" placeholder="Your Message" rows="4" required class="w-full p-3 border rounded-xl focus:ring focus:ring-indigo-300 outline-none"></textarea>
              <button type="submit" class="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition">
                Send Message
              </button>
            </form>
          </div>
        </div>

        <script>
          function openModal() {
            document.getElementById('contactModal').classList.add('active');
          }
          function closeModal() {
            document.getElementById('contactModal').classList.remove('active');
          }
        </script>
      </body>
    </html>
  `;
};
