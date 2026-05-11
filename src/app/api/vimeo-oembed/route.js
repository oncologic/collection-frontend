export const revalidate = 86400;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const directUrl = searchParams.get("url");
    const id = searchParams.get("id");
    const hash = searchParams.get("hash");

    let watchUrl = directUrl;
    if (!watchUrl) {
      if (!id) {
        return new Response(JSON.stringify({ error: "missing url or id" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      watchUrl = `https://vimeo.com/${id}${hash ? `/${hash}` : ""}`;
    }

    const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(
      watchUrl
    )}`;

    const res = await fetch(oembedUrl, {
      headers: { Accept: "application/json" },
      // Avoid caching errors downstream
      cache: "force-cache",
      next: { revalidate },
    });

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "oembed_fetch_failed", status: res.status }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }

    const data = await res.json();

    return new Response(
      JSON.stringify({
        thumbnailUrl: data.thumbnail_url,
        thumbnailWidth: data.thumbnail_width,
        thumbnailHeight: data.thumbnail_height,
        title: data.title,
        authorName: data.author_name,
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "cache-control": "public, max-age=86400, s-maxage=86400",
        },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "unexpected_error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
