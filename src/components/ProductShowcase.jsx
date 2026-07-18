import { useEffect, useState } from 'react';
import { fetchShopierProducts } from '../services/shopierProducts.js';

export function ProductShowcase({ shopierUrl, t }) {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();

    fetchShopierProducts({ signal: controller.signal })
      .then((loadedProducts) => {
        setProducts(loadedProducts);
        setStatus('ready');
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setStatus('error');
        }
      });

    return () => controller.abort();
  }, []);

  return (
    <section className="product-showcase" aria-labelledby="product-showcase-title">
      <div className="product-showcase-heading">
        <div>
          <p id="product-showcase-title">{t('shopLabel')} <span className="product-keyword">test</span></p>
        </div>
        <a className="shopier-link compact" href={shopierUrl} target="_blank" rel="noreferrer">
          {t('goToShop')}
        </a>
      </div>

      {status === 'loading' ? (
        <p className="product-state">{t('productsLoading')}</p>
      ) : null}

      {status === 'error' ? (
        <p className="product-state">{t('productsError')}</p>
      ) : null}

      {products.length > 0 ? (
        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-image-frame">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.title} loading="lazy" />
                ) : (
                  <div className="product-image-placeholder" aria-hidden="true">
                    LOOP
                  </div>
                )}
              </div>
              <div className="product-card-body">
                <h3>{product.title}</h3>
                {product.description ? <p>{product.description}</p> : null}
                <div className="product-card-footer">
                  {product.priceText ? <strong>{product.priceText}</strong> : <span />}
                  <a href={product.productUrl || shopierUrl} target="_blank" rel="noreferrer">
                    {t('inspect')}
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
