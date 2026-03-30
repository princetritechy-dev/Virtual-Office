"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/app/components/header";
import Footer from "@/app/components/footer";
import "./product-details.css";
import Link from "next/link";

type ProductImage = {
  id?: number;
  src?: string;
  thumbnail?: string;
  alt?: string;
};

type ProductPrice = {
  price?: string;
  regular_price?: string;
  sale_price?: string;
  currency_code?: string;
  currency_symbol?: string;
};

type Product = {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  short_description?: string;
  description?: string;
  images?: ProductImage[];
  prices?: ProductPrice;
};

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/products/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to fetch product");
        }
        return res.json();
      })
      .then((data) => {
        setProduct(data);
      })
      .catch((err) => {
        console.error("Product detail error:", err);
        setError(err.message || "Failed to fetch product");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  const handleAddToCart = async () => {
    try {
      if (!product) return;

      setAdding(true);

      const cartToken = localStorage.getItem("cart_token") || "";

      const res = await fetch("/api/cart/add-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "cart-token": cartToken,
        },
        body: JSON.stringify({
          id: product.id,
          quantity: 1,
        }),
      });

      const token = res.headers.get("Cart-Token");
      if (token) {
        localStorage.setItem("cart_token", token);
      }

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to add to cart");
      }

      router.push("/cart");
    } catch (error) {
      console.error(error);
      alert("Failed to add product to cart");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <main className="productPage">
        <Header />
        <div className="productContainer">
          <p className="productStateText">Loading product...</p>
        </div>
        <Footer />
      </main>
    );
  }

  if (error) {
    return (
      <main className="productPage">
        <Header />
        <div className="productContainer">
          <div className="productMessageCard">
            <h1 className="productMessageTitle">Product Details</h1>
            <p className="productErrorText">{error}</p>
            <button onClick={() => router.back()} className="backButton">
              Back
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="productPage">
        <Header />
        <div className="productContainer">
          <div className="productMessageCard">
            <h1 className="productMessageTitle">Product not found</h1>
            <button onClick={() => router.back()} className="backButton">
              Back
            </button>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  const mainImage = product.images?.[0]?.src || "";
  const price = product.prices?.price
    ? (Number(product.prices.price) / 100).toFixed(2)
    : "0.00";

  return (
    <main className="productPage">
      <Header />

      <section className="productContainer">
        <button onClick={() => router.back()} className="backButton">
          ← Back
        </button>

        <div className="productLayout">
          <div className="productImageWrap">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.images?.[0]?.alt || product.name}
                className="productMainImage"
              />
            ) : (
              <div className="productNoImage">No Image</div>
            )}
          </div>

          <div className="productContent">
            <h1 className="productTitle">{product.name}</h1>

            <p className="productPrice">
              {product.prices?.currency_symbol || "$"}
              {price}
            </p>

            {product.short_description && (
              <div
                className="productShortDescription"
                dangerouslySetInnerHTML={{ __html: product.short_description }}
              />
            )}

            {product.description && (
              <div
                className="productDescription"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}

            <div className="productActions">
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="primaryButton"
              >
                {adding ? "Adding..." : "Add to Cart"}
              </button>
              <Link
              href="/checkout"
              className="secondaryButton"
            >
              Buy Now
            </Link>

              
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}