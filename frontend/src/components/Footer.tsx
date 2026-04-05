export default function Footer() {
    return (
        <footer className="border-t border-gray-100 bg-white py-12">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
                <p className="text-sm text-gray-500">
                    &copy; {new Date().getFullYear()}{" "}
                    <span className="font-semibold text-gray-700">mark.it</span>
                    . All rights reserved.
                </p>
                <div className="flex gap-6">
                    <a
                        href="https://github.com/nkmiller7/mark.it"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-500 hover:text-gray-900 transition"
                    >
                        GitHub
                    </a>
                    <a
                        href="mailto:contact@markit.com"
                        className="text-sm text-gray-500 hover:text-gray-900 transition"
                    >
                        {/* Needs to be done prob just our names maybe??? */}
                        Contact
                    </a>
                    <a
                        href="#"
                        className="text-sm text-gray-500 hover:text-gray-900 transition"
                    >
                        About
                    </a>
                </div>
            </div>
        </footer>
    );
}
