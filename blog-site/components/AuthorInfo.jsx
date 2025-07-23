import Image from 'next/image';

export default function AuthorInfo({ author, readingTime }) {
  if (!author) return null;

  return (
    <div className="flex items-center space-x-3 text-sm text-text-muted">
      <Image
        src={author.avatarUrl || '/default-avatar.svg'}
        alt={author.name}
        width={40}
        height={40}
        className="rounded-full bg-gray-800"
      />
      <div>
        <p className="font-semibold text-text-primary">{author.name}</p>
        {readingTime && <p>{readingTime} min read</p>}
      </div>
    </div>
  );
} 