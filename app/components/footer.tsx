export function Footer() {
  return (
    <div className="fixed bottom-0 left-0 right-0 px-8">
      <div className="max-w-2xl mx-auto">
        <div className="border-t py-4 flex justify-between items-center">
          <div className="flex flex-row items-center gap-1">
            <p className="text-xs text-gray-600">recurwise</p>
            <p className="text-xs text-gray-600">2025</p>
          </div>
          <a
            href="mailto:recurwise@gmail.com"
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            recurwise@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
