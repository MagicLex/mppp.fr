import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Menu from './components/Menu';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import { CartProvider } from './context/CartContext';
import { trackPageView } from './services/analytics';

// Analytics tracker component
function AnalyticsTracker() {
  const location = useLocation();
  
  useEffect(() => {
    // Track page view on route change
    const pageName = location.pathname === '/' ? 'Menu' : 
                    location.pathname === '/panier' ? 'Panier' : 
                    location.pathname === '/commander' ? 'Commander' : 
                    location.pathname === '/mentions-legales' ? 'Mentions Légales' :
                    location.pathname === '/conditions-generales' ? 'Conditions Générales' : 'Page';
    
    trackPageView(location.pathname, `Mon P'tit Poulet - ${pageName}`);
  }, [location]);
  
  return null;
}

function App() {
  // Use state to control splash visibility
  const [showSplash, setShowSplash] = useState(true);
  
  // Check URL path - if we're on a legal page, don't show splash
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/mentions-legales' || path === '/conditions-generales') {
      setShowSplash(false);
    }
    
    // Also check sessionStorage for redirects
    const redirectPath = sessionStorage.getItem('redirectPath');
    if (redirectPath) {
      // If trying to access legal pages directly, bypass splash screen
      if (redirectPath === '/mentions-legales' || redirectPath === '/conditions-generales') {
        setShowSplash(false);
      }
      // Clear the stored path
      sessionStorage.removeItem('redirectPath');
    }
  }, []);

  if (showSplash) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center bg-[#ffbe34] z-50"
      >
        <img 
          src="/images/flyer.jpg" 
          alt="Mon P'tit Poulet" 
          className="max-w-full max-h-full object-contain" 
        />
        {/* Hidden close button (top right) */}
        <button 
          onClick={() => setShowSplash(false)}
          className="absolute top-4 right-4 text-transparent hover:text-black bg-transparent rounded-full p-2 transition-colors"
          aria-label="Fermer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <HashRouter>
      <CartProvider>
        <div className="min-h-screen bg-amber-50">
          <AnalyticsTracker />
          <Header />
          <main className="container mx-auto px-4 pb-12">
            <Routes>
              <Route path="/" element={<Menu />} />
              <Route path="/panier" element={<Cart />} />
              <Route path="/commander" element={<Checkout />} />
              <Route path="/mentions-legales" element={<LegalNotice />} />
              <Route path="/conditions-generales" element={<TermsAndConditions />} />
            </Routes>
          </main>
          <Toaster 
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#333',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                borderRadius: '0.5rem',
                border: '4px solid #000',
              },
            }} 
          />
          {/* Footer */}
          <footer className="bg-amber-200 py-3 text-center text-sm border-t border-amber-400 mt-auto">
            <div className="container mx-auto px-4">
              <nav className="flex justify-center space-x-4">
                <Link to="/mentions-legales" className="text-amber-900 hover:underline">Mentions Légales</Link>
                <span className="text-amber-900">|</span>
                <Link to="/conditions-generales" className="text-amber-900 hover:underline">Conditions Générales</Link>
              </nav>
            </div>
          </footer>
        </div>
      </CartProvider>
    </HashRouter>
  );
}

function LegalNotice() {
  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Mentions Légales</h1>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. Identification de l'entreprise</h2>
        <p>Mon P'tit Poulet, entreprise individuelle</p>
        <p>SIRET : 93965543700019</p>
        <p>Adresse : 8bis rue de la taunière 44860</p>
        <p>Email : contact@mppp.fr</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Hébergement</h2>
        <p>Ce site est hébergé par OVHCloud</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Collecte de données personnelles</h2>
        <p>Les informations recueillies sur ce site sont enregistrées dans un fichier informatisé par Mon P'tit Poulet pour la gestion des commandes et des livraisons.</p>
        <p>Elles sont conservées pendant 1 ans et sont destinées aux services contabilité de Mon P'tit Poulet.</p>
        <p>Conformément à la loi « informatique et libertés », vous pouvez exercer votre droit d'accès aux données vous concernant et les faire rectifier en contactant : contact@mppp.fr.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Propriété intellectuelle</h2>
        <p>L'ensemble du contenu de ce site (textes, images, vidéos, etc.) est la propriété exclusive de Mon P'tit Poulet ou de ses partenaires. Toute reproduction, même partielle, est strictement interdite sans autorisation préalable.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. Liens hypertextes</h2>
        <p>Le site peut contenir des liens vers d'autres sites. Mon P'tit Poulet n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.</p>
      </section>
    </div>
  );
}

function TermsAndConditions() {
  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Conditions Générales de Vente</h1>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1. Objet</h2>
        <p>Les présentes conditions générales de vente régissent les relations contractuelles entre Mon P'tit Poulet et ses clients dans le cadre de la vente de produits alimentaires. Toute commande implique l'acceptation sans réserve par le client des présentes conditions générales de vente.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Produits</h2>
        <p>Les caractéristiques essentielles des produits sont indiquées dans la fiche de chaque produit. Les photographies illustrant les produits n'entrent pas dans le champ contractuel et ne sont pas exhaustives.</p>
        <p>En cas d'indisponibilité d'un produit commandé, le client en sera informé et pourra choisir entre le remboursement ou le remplacement du produit.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Prix</h2>
        <p>Les prix sont indiqués en euros et sont entendus toutes taxes comprises (TTC). Ils tiennent compte de la TVA applicable au jour de la commande.</p>
        <p>Mon P'tit Poulet se réserve le droit de modifier ses prix à tout moment, mais les produits seront facturés sur la base des tarifs en vigueur au moment de la validation de la commande.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Commande et paiement</h2>
        <p>Le client valide sa commande après avoir vérifié le contenu de son panier. Cette validation constitue une acceptation irrévocable de la commande.</p>
        <p>Le paiement s'effectue en ligne par carte bancaire au moment de la validation de la commande. Toutes les transactions sont sécurisées.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. Livraison et retrait</h2>
        <p>Les commandes peuvent être retirées sur place à l'adresse indiquée sur le site, selon les horaires d'ouverture.</p>
        <p>Les délais de préparation sont indiqués à titre indicatif et dépendent du volume de commandes.</p>
        <p>En cas de retard significatif, le client sera informé dans les meilleurs délais.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">6. Droit de rétractation</h2>
        <p>Conformément à l'article L121-21-8 du Code de la Consommation, le droit de rétractation ne peut être exercé pour les denrées périssables.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">7. Responsabilité</h2>
        <p>Mon P'tit Poulet décline toute responsabilité en cas de mauvaise conservation des produits après leur retrait par le client.</p>
        <p>Le client est seul responsable du respect de la chaîne du froid après avoir pris possession de sa commande.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">8. Loi applicable et juridiction compétente</h2>
        <p>Les présentes conditions générales de vente sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>
      </section>
    </div>
  );
}

export default App;