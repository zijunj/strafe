export default function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // replace spaces/symbols with -
    .replace(/(^-|-$)+/g, ""); // trim leading/trailing dashes
}
