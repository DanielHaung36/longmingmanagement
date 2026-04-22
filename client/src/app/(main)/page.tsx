import Image from 'next/image'
import { redirect } from 'next/navigation';
export default function Home() {
  redirect('/home'); // 默认跳到 /home
  return <div className=""></div>
}
