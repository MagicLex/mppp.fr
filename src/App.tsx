import React, { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Menu from './components/Menu';
import Cart from './components/Cart';
import Checkout from './components/Checkout';
import { CartProvider } from './context/CartContext';
import { trackPageView, trackPurchase } from './services/analytics';
import { createDealForContact } from './services/hubspot';
// We'll import stripeService dynamically in the PaymentSuccess component

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
  // Splash screen removed, replaced with maintenance banner

  return (
    <HashRouter>
      <CartProvider>
        <div className="min-h-screen bg-amber-50">
          {/* Maintenance Banner */}
          <AnalyticsTracker />
          <Header />
          <main className="container mx-auto px-4 pb-12">
            <Routes>
              <Route path="/" element={<Menu />} />
              <Route path="/panier" element={<Cart />} />
              <Route path="/commander" element={<Checkout />} />
              <Route path="/mentions-legales" element={<LegalNotice />} />
              <Route path="/conditions-generales" element={<TermsAndConditions />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payment-cancel" element={<PaymentCancel />} />
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
        <p>Forme juridique : Entreprise Individuelle</p>
        <p>SIRET : 93965543700019</p>
        <p>SIREN : 939655437</p>
        <p>Adresse du siège social : 8bis rue de la taunière 44860 Pont Saint Martin</p>
        <p>Numéro de téléphone : 07 64 35 86 46</p>
        <p>Email : contact@mppp.fr</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Hébergement</h2>
        <p>Ce site est hébergé par OVHCloud - Siège social : 2 rue Kellermann - 59100 Roubaix - France - Téléphone : 1007</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Collecte et utilisation des données personnelles</h2>
        <p>Les informations recueillies sur ce site sont enregistrées dans un fichier informatisé par Mon P'tit Poulet pour la gestion des commandes et des livraisons.</p>
        <p>Elles sont conservées pendant 1 an et sont destinées aux services comptabilité de Mon P'tit Poulet.</p>
        <p>Conformément à la loi « informatique et libertés » et au Règlement Général sur la Protection des Données (RGPD), vous pouvez exercer votre droit d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition aux données vous concernant en contactant : contact@mppp.fr.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. Cookies</h2>
        <p>Notre site utilise le stockage local (localStorage) uniquement pour mémoriser les produits dans votre panier. Aucun cookie de traçage n'est utilisé à l'exception de ceux liés à Google Analytics pour analyser le trafic du site.</p>
        <p>Vous pouvez configurer votre navigateur pour bloquer les cookies tiers ou être alerté lorsque des cookies sont envoyés.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">6. Propriété intellectuelle</h2>
        <p>L'ensemble du contenu de ce site (textes, images, vidéos, etc.) est la propriété exclusive de Mon P'tit Poulet ou de ses partenaires. Toute reproduction, même partielle, est strictement interdite sans autorisation préalable.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">7. Liens hypertextes</h2>
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
        <p>Les présentes conditions générales de vente régissent les relations contractuelles entre Mon P'tit Poulet, entreprise individuelle, SIRET : 93965543700019, dont le siège social est situé au 8bis rue de la taunière 44860 Pont Saint Martin, et ses clients dans le cadre de la vente de produits alimentaires. Toute commande implique l'acceptation sans réserve par le client des présentes conditions générales de vente.</p>
      </section>
      
      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">2. Produits</h2>
        <p>Les caractéristiques essentielles des produits sont indiquées dans la fiche de chaque produit. Les photographies illustrant les produits n'entrent pas dans le champ contractuel et ne sont pas exhaustives.</p>
        <p>En cas d'indisponibilité d'un produit commandé, le client en sera informé et pourra choisir entre le remboursement ou le remplacement du produit.</p>
        <p>La durée de l'offre des produits est déterminée par l'actualisation du site ou par épuisement des stocks.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">3. Prix</h2>
        <p>Les prix sont indiqués en euros et sont entendus toutes taxes comprises (TTC). Ils tiennent compte de la TVA applicable au jour de la commande.</p>
        <p>Mon P'tit Poulet se réserve le droit de modifier ses prix à tout moment, mais les produits seront facturés sur la base des tarifs en vigueur au moment de la validation de la commande.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">4. Commande et paiement</h2>
        <p>Le client valide sa commande après avoir vérifié le contenu de son panier. Cette validation constitue une acceptation irrévocable de la commande.</p>
        <p>Le paiement s'effectue en ligne par carte bancaire au moment de la validation de la commande. Toutes les transactions sont sécurisées par PayPlug.</p>
        <p>Le coût de la communication à distance utilisée pour la réalisation de la commande est à la charge du client et correspond au tarif appliqué par son fournisseur d'accès à internet.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">5. Livraison et retrait</h2>
        <p>Les commandes peuvent être retirées sur place à l'adresse du restaurant : 24 Rue des Olivettes, 44000 Nantes, selon les horaires d'ouverture affichés sur le site.</p>
        <p>Les délais de préparation sont indiqués lors de la commande et dépendent du volume de commandes. Les délais de retrait sont généralement entre 15 et 30 minutes après confirmation de la commande.</p>
        <p>En cas de retard significatif, le client sera informé par téléphone ou par email dans les meilleurs délais.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">6. Droit de rétractation</h2>
        <p>Conformément à l'article L121-21-8 du Code de la Consommation, le droit de rétractation ne peut être exercé pour les denrées périssables.</p>
        <p>En raison de la nature des produits vendus (produits alimentaires périssables), les commandes ne peuvent être annulées une fois validées et payées.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">7. Service après-vente</h2>
        <p>Pour toute question relative à une commande ou pour signaler un problème, le client peut contacter Mon P'tit Poulet :</p>
        <ul className="list-disc pl-6 mt-2">
          <li>Par téléphone au 07 64 35 86 46</li>
          <li>Par email à contact@mppp.fr</li>
          <li>Sur place au restaurant</li>
        </ul>
        <p className="mt-2">En cas de problème avéré avec un produit (qualité non conforme, erreur dans la commande), Mon P'tit Poulet s'engage à proposer une solution sous forme de remboursement ou de remplacement selon la situation.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">8. Responsabilité</h2>
        <p>Mon P'tit Poulet décline toute responsabilité en cas de mauvaise conservation des produits après leur retrait par le client.</p>
        <p>Le client est seul responsable du respect de la chaîne du froid après avoir pris possession de sa commande.</p>
        <p>Pour des raisons d'hygiène et de sécurité alimentaire, les produits ne peuvent être ni repris ni échangés une fois la transaction finalisée.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">9. Protection des données personnelles</h2>
        <p>Les informations personnelles collectées lors de la commande sont nécessaires au traitement de celle-ci et à la gestion de la relation commerciale.</p>
        <p>Ces informations sont traitées conformément à notre politique de confidentialité accessible dans les mentions légales.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold mb-2">10. Loi applicable et juridiction compétente</h2>
        <p>Les présentes conditions générales de vente sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>
        <p>Tout différend relatif à l'interprétation ou à l'exécution des présentes conditions générales de vente sera soumis à une procédure de médiation préalable. En cas d'échec de la médiation, le litige sera porté devant le tribunal compétent de Nantes.</p>
      </section>
    </div>
  );
}

function PaymentSuccess() {
  const [isProcessing, setIsProcessing] = useState(true);
  const [orderData, setOrderData] = useState<any>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { clearCart } = useCart();
  
  useEffect(() => {
    const processPaymentSuccess = async () => {
      try {
        // Get the stored order data
        const storedOrder = localStorage.getItem('mpp_order');
        if (!storedOrder) {
          throw new Error('No order data found');
        }
        
        const orderInfo = JSON.parse(storedOrder);
        setOrderData(orderInfo);
        
        // Get payment ID from URL if available
        const urlParams = new URLSearchParams(window.location.search);
        const paymentId = urlParams.get('id');
        const paymentMethod = 'stripe'; // We only use Stripe now
        
        // Validate payment
        if (paymentId) {
          let paymentSuccessful = false;
          
          // Verify payment with Stripe
          const { getSessionStatus } = await import('./services/stripeService');
          try {
            const session = await getSessionStatus(paymentId);
            paymentSuccessful = session.payment_status === 'paid';
          } catch (stripeError) {
            console.error('Error confirming Stripe payment:', stripeError);
            throw new Error('Failed to verify Stripe payment');
          }
          
          if (paymentSuccessful) {
            // Create deal in HubSpot
            if (orderInfo.orderDetails && orderInfo.orderDetails.email) {
              const orderSummary = orderInfo.items.map((item: any) => 
                `${item.quantity}x ${item.product.name}`
              ).join(', ');
              
              await createDealForContact(
                orderInfo.orderDetails.email,
                orderInfo.total,
                `Commande: ${orderSummary}. Heure de retrait: ${orderInfo.orderDetails.pickupTime} (via ${paymentMethod})`
              );
              
              // Track purchase event
              trackPurchase(
                paymentId,
                orderInfo.total,
                orderInfo.items.map((item: any) => ({
                  productId: item.product.id,
                  productName: item.product.name,
                  price: item.product.price + (item.options ? item.options.reduce((sum: number, opt: any) => sum + opt.price, 0) : 0),
                  quantity: item.quantity
                }))
              );
            }
            
            setPaymentConfirmed(true);
            // Clear the stored order and cart
            localStorage.removeItem('mpp_order');
            clearCart(); // Clear the cart immediately
          } else {
            throw new Error(`Le paiement n'a pas pu être confirmé via ${paymentMethod}`);
          }
        } else {
          // Check if we have a Stripe session ID in the URL (Stripe redirect format)
          const sessionId = urlParams.get('session_id');
          if (sessionId) {
            // Import dynamically to avoid breaking existing code
            const { getSessionStatus } = await import('./services/stripeService');
            // Verify payment with Stripe
            try {
              const session = await getSessionStatus(sessionId);
              
              if (session.payment_status === 'paid') {
                // Create deal in HubSpot
                if (orderInfo.orderDetails && orderInfo.orderDetails.email) {
                  const orderSummary = orderInfo.items.map((item: any) => 
                    `${item.quantity}x ${item.product.name}`
                  ).join(', ');
                  
                  await createDealForContact(
                    orderInfo.orderDetails.email,
                    orderInfo.total,
                    `Commande: ${orderSummary}. Heure de retrait: ${orderInfo.orderDetails.pickupTime} (via Stripe)`
                  );
                  
                  // Track purchase event
                  trackPurchase(
                    sessionId,
                    orderInfo.total,
                    orderInfo.items.map((item: any) => ({
                      productId: item.product.id,
                      productName: item.product.name,
                      price: item.product.price + (item.options ? item.options.reduce((sum: number, opt: any) => sum + opt.price, 0) : 0),
                      quantity: item.quantity
                    }))
                  );
                }
                
                setPaymentConfirmed(true);
                // Clear the stored order and cart
                localStorage.removeItem('mpp_order');
                clearCart(); // Clear the cart immediately
              } else {
                throw new Error('Le paiement Stripe n\'a pas pu être confirmé');
              }
            } catch (stripeError) {
              console.error('Error confirming Stripe payment:', stripeError);
              throw new Error('Failed to verify Stripe payment');
            }
          } else {
            // If no payment ID or session ID, we can't confirm the payment
            throw new Error('No payment identifier found in redirect URL');
          }
        }
      } catch (error) {
        console.error('Error processing payment success:', error);
        setError(error instanceof Error ? error.message : 'Une erreur est survenue lors de la vérification du paiement');
      } finally {
        setIsProcessing(false);
      }
    };
    
    processPaymentSuccess();
  }, []);
  
  if (isProcessing) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg border-4 border-black">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Traitement de votre paiement...</h2>
          <p className="mb-6">Veuillez patienter pendant que nous confirmons votre commande.</p>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
        </div>
      </div>
    );
  }
  
  if (error || !orderData) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg border-4 border-black">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {error ? "Erreur de paiement" : "Aucune commande trouvée"}
          </h2>
          <div className="mb-6 text-red-600 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="mb-6">
            {error 
              ? `${error}. Veuillez contacter le restaurant.` 
              : "Nous n'avons pas pu trouver les détails de votre commande."}
          </p>
          <Link to="/" className="btn-cartoon bg-amber-400 text-white py-2 px-4 rounded-xl font-cartoon">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg border-4 border-black">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">
          {paymentConfirmed ? "Commande confirmée !" : "Traitement de votre commande..."}
        </h2>
        
        {paymentConfirmed ? (
          <>
            <div className="mb-6 text-green-600 flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mb-2">Merci pour votre commande !</p>
            <p className="mb-6">Vous recevrez un email de confirmation à {orderData.orderDetails?.email}.</p>
            
            <div className="mb-6 p-4 bg-amber-100 rounded-lg text-left">
              <h3 className="font-bold mb-2">Détails de la commande:</h3>
              <p>Heure de retrait: {orderData.orderDetails?.pickupTime || "Dès que possible"}</p>
              <p>Total: {orderData.total?.toFixed(2)}€</p>
              <p>Méthode de paiement: {orderData.paymentMethod === 'stripe' ? 'Stripe' : 'PayPlug'}</p>
            </div>
            
            <Link to="/" className="btn-cartoon bg-amber-400 text-white py-2 px-4 rounded-xl font-cartoon">
              Retour à l'accueil
            </Link>
          </>
        ) : (
          <>
            <p className="mb-6">Le paiement a été reçu, nous finalisons votre commande...</p>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          </>
        )}
      </div>
    </div>
  );
}

function PaymentCancel() {
  const [orderData, setOrderData] = useState<any>(null);
  
  useEffect(() => {
    // Get the stored order data
    const storedOrder = localStorage.getItem('mpp_order');
    if (storedOrder) {
      setOrderData(JSON.parse(storedOrder));
    }
  }, []);
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg border-4 border-black">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Paiement annulé</h2>
        <div className="mb-6 text-red-600 flex justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="mb-6">Votre paiement a été annulé ou n'a pas abouti.</p>
        
        {orderData && (
          <div className="mb-6 flex justify-center space-x-4">
            <Link to="/panier" className="btn-cartoon bg-gray-500 text-white py-2 px-4 rounded-xl font-cartoon">
              Retour au panier
            </Link>
            <Link to="/commander" className="btn-cartoon bg-amber-400 text-white py-2 px-4 rounded-xl font-cartoon">
              Réessayer
            </Link>
          </div>
        )}
        
        <Link to="/" className="btn-cartoon bg-amber-400 text-white py-2 px-4 rounded-xl font-cartoon">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

export default App;