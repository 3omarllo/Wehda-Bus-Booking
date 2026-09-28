import { type ReactNode, useMemo, useState } from 'react';
import logoAsset from '../../../.local/conversation-workspace/files/attached_assets/IMG_1213_1790589345123.jpeg';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  getGetBookingQueryKey, getGetStaffDashboardQueryKey, getGetTripSeatsQueryKey, getListStaffBookingsQueryKey, getListTripsQueryKey,
  useGetBooking, useGetStaffDashboard, useGetTripSeats, useHoldBooking, useListStaffBookings, useListTrips, useReviewBookingPayment, useSubmitPayment,
} from '@workspace/api-client-react';
import { ArrowLeft, ArrowRight, Bus, CalendarDays, Check, ChevronDown, CircleHelp, Clock3, CreditCard, FileText, Filter, Headphones, Home as HomeIcon, Info, Landmark, MapPin, Menu, Phone, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Ticket, UserRound, Users, WalletCards, X } from 'lucide-react';
import { Link, Route, Switch, Router as WouterRouter, useLocation, useParams } from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const logoSrc = logoAsset;

const money = (value: number | undefined) => `${(value ?? 0).toLocaleString('ar-EG')} جنيه`;
const dateText = (value: string | undefined) => value ? new Date(value).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' }) : '—';
const timeText = (value: string | undefined) => value ? new Date(value).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '—';

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5" data-testid="link-logo">
      <img src={logoSrc} alt="شعار وحدة باص" className={`${compact ? 'h-10 w-10' : 'h-11 w-11'} rounded-xl object-cover shadow-sm`} />
      <span className="leading-none">
        <strong className="block font-display text-xl font-extrabold tracking-tight text-slate-900">وحدة</strong>
        {!compact && <small className="mt-0.5 block text-[10px] font-semibold tracking-[.18em] text-orange-600">BUS BOOKING</small>}
      </span>
    </Link>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="relative z-20 border-b border-sky-900/10 bg-sky-50/90 backdrop-blur-md">
      <div className="we-section flex h-[76px] items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex" aria-label="التنقل الرئيسي">
          <Link href="/" className="hover:text-orange-600" data-testid="link-home">الرئيسية</Link>
          <Link href="/trips" className="hover:text-orange-600" data-testid="link-trips">احجز رحلتك</Link>
          <Link href="/account" className="hover:text-orange-600" data-testid="link-account">رحلاتي</Link>
          <Link href="/staff" className="hover:text-orange-600" data-testid="link-staff">بوابة التشغيل</Link>
        </nav>
        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/account" className="flex items-center gap-2 rounded-full border border-slate-900/10 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-orange-400" data-testid="link-login"><UserRound size={16} /> حسابي</Link>
          <Link href="/trips" className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-extrabold text-slate-950 shadow-sm hover:bg-orange-400" data-testid="link-header-book">احجز الآن</Link>
        </div>
        <button className="rounded-lg p-2 text-slate-700 md:hidden" onClick={() => setOpen(!open)} aria-label="فتح القائمة" data-testid="button-mobile-menu"><Menu size={23} /></button>
      </div>
      {open && <div className="we-section border-t border-sky-900/10 py-4 md:hidden"><div className="flex flex-col gap-3 text-sm font-bold"><Link onClick={() => setOpen(false)} href="/" data-testid="mobile-link-home">الرئيسية</Link><Link onClick={() => setOpen(false)} href="/trips" data-testid="mobile-link-trips">احجز رحلتك</Link><Link onClick={() => setOpen(false)} href="/account" data-testid="mobile-link-account">رحلاتي</Link><Link onClick={() => setOpen(false)} href="/staff" data-testid="mobile-link-staff">بوابة التشغيل</Link></div></div>}
    </header>
  );
}

function Page({ children, staff = false }: { children: ReactNode; staff?: boolean }) {
  return <div className={`min-h-[100dvh] ${staff ? 'bg-slate-100' : 'bg-[#edf9fc]'}`}><Header />{children}<Footer /></div>;
}

function Footer() {
  return <footer className="mt-20 border-t border-sky-900/10 bg-slate-950 text-sky-100"><div className="we-section flex flex-col gap-5 py-9 sm:flex-row sm:items-center sm:justify-between"><div><Logo compact /><p className="mt-3 max-w-xs text-xs leading-6 text-sky-100/60">مشوارك بين القاهرة وإسكندرية يبدأ بخطوة سهلة وآمنة.</p></div><div className="flex items-center gap-4 text-xs text-sky-100/60"><span>خدمة العملاء: ١٦١٦</span><span>© وحدة ٢٠٢٤</span></div></div></footer>;
}

function Status({ children, tone = 'orange' }: { children: ReactNode; tone?: 'orange' | 'green' | 'red' | 'blue' }) {
  const colors = { orange: 'bg-orange-100 text-orange-700', green: 'bg-emerald-100 text-emerald-700', red: 'bg-red-100 text-red-700', blue: 'bg-sky-100 text-sky-700' };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${colors[tone]}`}>{children}</span>;
}

function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center"><Info className="mx-auto mb-3 text-red-500" /><h3 className="font-bold text-red-900">حصلت مشكلة في تحميل البيانات</h3><p className="mt-1 text-sm text-red-700/80">تأكد من الاتصال وحاول مرة أخرى.</p>{onRetry && <button onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white" data-testid="button-retry"><RefreshCw size={15} /> إعادة المحاولة</button>}</div>;
}

function TripSkeleton() {
  return <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-36 rounded-2xl skeleton" />)}</div>;
}

function SearchBox() {
  const [, setLocation] = useLocation();
  const [from, setFrom] = useState('القاهرة');
  const [to, setTo] = useState('الإسكندرية');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState('1');
  const swap = () => { const next = from; setFrom(to); setTo(next); };
  return <form onSubmit={(event) => { event.preventDefault(); setLocation(`/trips?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}&passengers=${passengers}`); }} className="relative z-10 mx-auto -mb-8 max-w-5xl rounded-[1.35rem] border border-white/70 bg-white p-3 shadow-lg md:p-4" data-testid="form-trip-search">
    <div className="grid gap-2 md:grid-cols-[1.1fr_36px_1.1fr_1fr_.65fr_130px]">
      <label className="search-field"><span>من</span><MapPin size={17} /><select value={from} onChange={(event) => setFrom(event.target.value)} data-testid="select-from"><option>القاهرة</option><option>الإسكندرية</option></select></label>
      <button type="button" onClick={swap} className="self-center justify-self-center rounded-full bg-sky-100 p-2 text-sky-700 hover:bg-orange-100 hover:text-orange-700" aria-label="تبديل المحطات" data-testid="button-swap"><ArrowLeft size={15} /></button>
      <label className="search-field"><span>إلى</span><MapPin size={17} /><select value={to} onChange={(event) => setTo(event.target.value)} data-testid="select-to"><option>الإسكندرية</option><option>القاهرة</option></select></label>
      <label className="search-field"><span>تاريخ السفر</span><CalendarDays size={17} /><input type="date" value={date} onChange={(event) => setDate(event.target.value)} data-testid="input-date" /></label>
      <label className="search-field"><span>المسافرون</span><Users size={17} /><select value={passengers} onChange={(event) => setPassengers(event.target.value)} data-testid="select-passengers"><option value="1">١ مسافر</option><option value="2">٢ مسافرين</option><option value="3">٣ مسافرين</option><option value="4">٤ مسافرين</option></select></label>
      <button type="submit" className="flex min-h-[58px] items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 font-extrabold text-slate-950 shadow-sm hover:bg-orange-400" data-testid="button-search"><Search size={18} /> ابحث</button>
    </div>
  </form>;
}

function Home() {
  return <Page><main>
    <section className="relative overflow-hidden bg-[#8bd5eb] pb-24 pt-16 md:pt-24">
      <div className="absolute -left-24 top-8 h-72 w-72 rounded-full border-[34px] border-white/25" /><div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full border-[22px] border-orange-400/50" />
      <div className="we-section relative grid items-center gap-12 md:grid-cols-[1.05fr_.95fr]">
        <div className="animate-rise text-center md:text-right"><p className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-orange-300"><span className="h-2 w-2 rounded-full bg-orange-400" /> رحلات يومية بين القاهرة وإسكندرية</p><h1 className="font-display text-4xl font-extrabold leading-[1.23] tracking-tight text-slate-950 md:text-6xl">مشوارك أسهل<br /><span className="text-orange-600">مع وحدة.</span></h1><p className="mx-auto mt-5 max-w-md text-base leading-8 text-slate-900/70 md:mx-0">احجز مقعدك في دقائق، تابع رحلتك لحظة بلحظة، ووصل مرتاح — بسعر واضح ومن غير مفاجآت.</p><div className="mt-7 flex justify-center gap-5 text-xs font-bold text-slate-800/70 md:justify-start"><span className="flex items-center gap-1.5"><ShieldCheck size={17} className="text-orange-600" /> حجز موثوق</span><span className="flex items-center gap-1.5"><Clock3 size={17} className="text-orange-600" /> مواعيد دقيقة</span></div></div>
        <div className="animate-rise-2 relative mx-auto hidden h-[310px] w-full max-w-[410px] md:block"><div className="absolute inset-8 rotate-3 rounded-[2.4rem] bg-slate-950 shadow-2xl" /><div className="absolute inset-0 -rotate-3 overflow-hidden rounded-[2.4rem] border-8 border-white/80 bg-orange-500 p-7 shadow-xl"><div className="flex items-center justify-between"><span className="rounded-full bg-slate-950 px-3 py-1 text-[10px] font-bold text-white">Cairo ↔ Alex</span><Bus size={30} className="text-slate-950" /></div><div className="mt-14 font-display text-5xl font-extrabold leading-none text-slate-950">رايح<br />جاي؟</div><div className="mt-7 flex items-center justify-between text-xs font-bold text-slate-950/70"><span>وحدة باص</span><span>01 / 04</span></div></div></div>
      </div>
      <div className="we-section mt-12"><SearchBox /></div>
    </section>
    <section className="we-section grid gap-5 py-20 md:grid-cols-[1.1fr_.9fr]"><div className="rounded-3xl bg-slate-950 p-8 text-sky-50 md:p-10"><p className="text-sm font-bold text-orange-400">ليه وحدة؟</p><h2 className="mt-3 max-w-lg font-display text-3xl font-extrabold leading-tight md:text-4xl">كل تفصيلة معمولة عشان توصل براحة.</h2><div className="mt-9 grid grid-cols-2 gap-6 text-sm"><div><strong className="block text-2xl text-orange-400">١٦١٦</strong><span className="text-sky-100/60">دعم على الطريق</span></div><div><strong className="block text-2xl text-orange-400">٤</strong><span className="text-sky-100/60">مواعيد يومية</span></div></div></div><div className="grid gap-5"><div className="rounded-3xl border border-sky-900/10 bg-white p-7 shadow-sm"><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600"><WalletCards size={22} /></div><h3 className="font-bold">سعر واضح من البداية</h3><p className="mt-2 text-sm leading-7 text-slate-500">مش هنفاجئك برسوم مخفية. شوف السعر كامل قبل ما تأكد الحجز.</p></div><div className="rounded-3xl border border-sky-900/10 bg-white p-7 shadow-sm"><div className="mb-6 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700"><Headphones size={22} /></div><h3 className="font-bold">إحنا معاك</h3><p className="mt-2 text-sm leading-7 text-slate-500">فريق خدمة عملاء حقيقي يتابعك قبل الرحلة وأثناءها.</p></div></div></section>
  </main></Page>;
}

function TripCard({ trip }: { trip: any }) {
  const lowSeats = trip.seatsLeft <= 7;
  return <article className="group rounded-2xl border border-sky-900/10 bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md" data-testid={`card-trip-${trip.id}`}>
    <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="rounded-xl bg-sky-100 p-2.5 text-sky-700"><Bus size={21} /></div><div><div className="flex items-center gap-2 text-lg font-extrabold"><span data-testid={`text-departure-${trip.id}`}>{timeText(trip.departure)}</span><ArrowLeft size={15} className="text-orange-500" /><span>{timeText(trip.arrival)}</span></div><p className="text-xs text-slate-500">{trip.fromStation || trip.from} ← {trip.toStation || trip.to}</p></div></div><div className="text-left"><strong className="block text-xl font-extrabold text-slate-950" data-testid={`text-price-${trip.id}`}>{money(trip.price)}</strong><span className="text-xs text-slate-500">للمقعد</span></div></div>
    <div className="my-5 flex flex-wrap items-center gap-2 border-y border-dashed border-slate-200 py-3 text-xs text-slate-500"><span className="flex items-center gap-1"><Clock3 size={14} /> {trip.duration}</span><span className="h-1 w-1 rounded-full bg-slate-300" /><span>{trip.busType}</span>{(trip.amenities || []).slice(0, 2).map((amenity: string) => <span key={amenity} className="rounded-full bg-slate-100 px-2 py-1">{amenity}</span>)}{lowSeats && <Status tone="red">باقي {trip.seatsLeft} مقاعد</Status>}</div>
    <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-400">{dateText(trip.departure)}</span><Link href={`/book/${trip.id}`} className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-extrabold text-slate-950 hover:bg-orange-400" data-testid={`button-book-trip-${trip.id}`}>اختار الرحلة <ArrowLeft size={15} /></Link></div>
  </article>;
}

function Trips() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [direction, setDirection] = useState('الكل');
  const [sort, setSort] = useState('الأقرب');
  const queryParams = useMemo(() => ({}), []);
  const tripsQuery = useListTrips(queryParams, { query: { queryKey: getListTripsQueryKey(queryParams) } });
  const trips = useMemo(() => {
    const all = [...(tripsQuery.data || [])].filter((trip: any) => direction === 'الكل' || trip.from === direction);
    return all.sort((a: any, b: any) => sort === 'السعر الأقل' ? a.price - b.price : new Date(a.departure).getTime() - new Date(b.departure).getTime());
  }, [tripsQuery.data, direction, sort]);
  return <Page><main className="we-section py-10 md:py-14"><div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between"><div><p className="text-sm font-bold text-orange-600">اختار وقتك</p><h1 className="mt-1 font-display text-3xl font-extrabold md:text-4xl">الرحلات المتاحة</h1><p className="mt-2 text-sm text-slate-500">كل المقاعد والأسعار محدثة لحظياً.</p></div><button onClick={() => setFiltersOpen(!filtersOpen)} className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold md:hidden" data-testid="button-toggle-filters"><SlidersHorizontal size={16} /> فلاتر</button></div>
    <div className={`${filtersOpen ? 'block' : 'hidden'} mb-6 rounded-2xl border border-slate-200 bg-white p-4 md:block`}><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-2 text-sm font-bold"><Filter size={16} className="text-orange-500" /> اتجاه الرحلة <div className="flex gap-2">{['الكل', 'القاهرة', 'الإسكندرية'].map((value) => <button key={value} onClick={() => setDirection(value)} className={`rounded-full px-3 py-1.5 text-xs ${direction === value ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`} data-testid={`button-filter-${value}`}>{value}</button>)}</div></div><label className="flex items-center gap-2 text-sm font-bold">ترتيب حسب<select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs" data-testid="select-sort"><option>الأقرب</option><option>السعر الأقل</option></select></label></div></div>
    <div className="grid gap-7 lg:grid-cols-[1fr_270px]"><div>{tripsQuery.isLoading ? <TripSkeleton /> : tripsQuery.isError ? <ErrorState onRetry={() => void tripsQuery.refetch()} /> : trips.length ? <div className="space-y-3">{trips.map((trip: any) => <TripCard key={trip.id} trip={trip} />)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center"><Bus className="mx-auto text-slate-300" size={40} /><h3 className="mt-3 font-bold">لا توجد رحلات بهذا الاختيار</h3><p className="mt-1 text-sm text-slate-500">جرب تغيير الاتجاه أو التاريخ.</p></div>}</div><aside className="hidden h-fit rounded-2xl bg-slate-950 p-6 text-sky-50 lg:block"><div className="mb-5 flex items-center gap-2 text-orange-400"><ShieldCheck size={18} /><span className="text-sm font-bold">حجزك في أمان</span></div><p className="text-sm leading-7 text-sky-100/65">المقاعد التي تختارها تظل محجوزة لك أثناء إتمام بيانات الحجز والدفع.</p><div className="mt-6 border-t border-white/10 pt-5 text-xs leading-6 text-sky-100/50">تقدر تغير رأيك؟ تواصل معنا على ١٦١٦ قبل تأكيد الدفع.</div></aside></div>
  </main></Page>;
}

function BookingPage() {
  const params = useParams();
  const tripId = Number(params.tripId || 0);
  const [, setLocation] = useLocation();
  const tripsQuery = useListTrips({}, { query: { queryKey: getListTripsQueryKey({}) } });
  const trip = (tripsQuery.data || []).find((item: any) => item.id === tripId);
  const seatsQuery = useGetTripSeats(tripId, { query: { enabled: tripId > 0, queryKey: getGetTripSeatsQueryKey(tripId) } });
  const hold = useHoldBooking();
  const pay = useSubmitPayment();
  const [selected, setSelected] = useState<number[]>([]);
  const [stage, setStage] = useState<'details' | 'payment'>('details');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pickup, setPickup] = useState('المحطة');
  const [pickupPoint, setPickupPoint] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'vodafone_cash' | 'instapay'>('vodafone_cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [booking, setBooking] = useState<any>(null);
  const seatList = seatsQuery.data?.seats || [];
  const toggleSeat = (number: number, state: string) => { if (state !== 'available') return; setSelected((current) => current.includes(number) ? current.filter((item) => item !== number) : current.length < 4 ? [...current, number] : current); };
  if (!trip && (tripsQuery.isLoading || tripId === 0)) return <Page><div className="we-section py-16"><div className="h-8 w-56 skeleton rounded-lg" /><div className="mt-5 h-52 skeleton rounded-2xl" /></div></Page>;
  if (!trip) return <Page><div className="we-section py-24"><ErrorState onRetry={() => setLocation('/trips')} /></div></Page>;
  const total = trip.price * selected.length + (pickup === 'توصيل منزلي' ? 35 : 0);
  const submitHold = () => hold.mutate({ data: { tripId, seats: selected, passengerName: name, passengerPhone: phone, pickupType: pickup, pickupPoint: pickupPoint || null } }, { onSuccess: (result) => { setBooking(result); setStage('payment'); } });
  const submitPayment = () => pay.mutate({ bookingId: booking.id, data: { method: paymentMethod, transactionRef, senderPhone } }, { onSuccess: (result) => setLocation(`/ticket/${result.reference}`) });
  return <Page><main className="we-section py-8 md:py-12"><div className="mb-7 flex items-center gap-3 text-sm"><Link href="/trips" className="text-slate-500 hover:text-orange-600" data-testid="link-back-trips">الرحلات</Link><ArrowLeft size={14} className="text-slate-400" /><span className="font-bold">إتمام الحجز</span></div><div className="grid gap-6 lg:grid-cols-[1fr_320px]"><div className="space-y-5">
    <section className="rounded-2xl border border-sky-900/10 bg-white p-5 shadow-sm md:p-7"><div className="flex items-start justify-between"><div><Status tone="blue">رحلة ذهاب</Status><h1 className="mt-3 font-display text-2xl font-extrabold">{trip.from} <ArrowLeft className="mx-1 inline text-orange-500" size={18} /> {trip.to}</h1><p className="mt-1 text-sm text-slate-500">{dateText(trip.departure)} · {timeText(trip.departure)} إلى {timeText(trip.arrival)}</p></div><Bus className="text-orange-500" size={31} /></div></section>
    <section className="rounded-2xl border border-sky-900/10 bg-white p-5 shadow-sm md:p-7"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">اختار مقعدك</h2><p className="mt-1 text-xs text-slate-500">اختار حتى ٤ مقاعد</p></div><div className="flex gap-3 text-[11px] text-slate-500"><span><i className="seat-dot available" /> متاح</span><span><i className="seat-dot selected" /> اختيارك</span><span><i className="seat-dot booked" /> محجوز</span></div></div><div className="mx-auto max-w-[310px] rounded-[2rem] border-2 border-slate-200 bg-sky-50/60 p-5"><div className="mb-6 flex items-center justify-between rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white"><span>السائق</span><Bus size={16} className="text-orange-400" /></div><div className="grid grid-cols-4 gap-3">{seatList.length ? seatList.map((seat: any) => <button key={seat.number} onClick={() => toggleSeat(seat.number, seat.state)} disabled={seat.state !== 'available'} className={`seat ${seat.state} ${selected.includes(seat.number) ? 'selected' : ''}`} aria-label={`المقعد ${seat.number}`} data-testid={`button-seat-${seat.number}`}>{seat.number}</button>) : <div className="col-span-4 py-10 text-center text-sm text-slate-500">جاري تحميل المقاعد...</div>}</div></div></section>
    {stage === 'details' ? <section className="rounded-2xl border border-sky-900/10 bg-white p-5 shadow-sm md:p-7"><h2 className="font-bold">بيانات المسافر</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><label className="field-label">الاسم بالكامل<input value={name} onChange={(event) => setName(event.target.value)} placeholder="مثال: أحمد محمد" data-testid="input-passenger-name" /></label><label className="field-label">رقم الموبايل<input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="01xxxxxxxxx" inputMode="tel" data-testid="input-passenger-phone" /></label></div><h3 className="mt-7 font-bold">طريقة الركوب</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><button onClick={() => setPickup('المحطة')} className={`pickup-option ${pickup === 'المحطة' ? 'active' : ''}`} data-testid="button-pickup-station"><Landmark size={20} /><span><strong>من المحطة</strong><small>بدون رسوم إضافية</small></span></button><button onClick={() => setPickup('توصيل منزلي')} className={`pickup-option ${pickup === 'توصيل منزلي' ? 'active' : ''}`} data-testid="button-pickup-home"><MapPin size={20} /><span><strong>توصيل منزلي</strong><small>إضافة ٣٥ جنيه</small></span></button></div>{pickup === 'توصيل منزلي' && <label className="field-label mt-4">عنوان الاستلام<input value={pickupPoint} onChange={(event) => setPickupPoint(event.target.value)} placeholder="المنطقة والشارع" data-testid="input-pickup-point" /></label>}<button onClick={submitHold} disabled={!selected.length || name.length < 2 || phone.length < 8 || hold.isPending} className="mt-7 w-full rounded-xl bg-orange-500 py-3.5 font-extrabold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40" data-testid="button-continue-payment">{hold.isPending ? 'جاري تأكيد المقاعد...' : 'استمرار للدفع'}</button></section> : <section className="rounded-2xl border border-sky-900/10 bg-white p-5 shadow-sm md:p-7"><div className="flex items-center justify-between"><div><h2 className="font-bold">الدفع بالمحفظة</h2><p className="mt-1 text-sm text-slate-500">المقعد محجوز لك مؤقتاً، أكمل الدفع خلال ١٠ دقائق.</p></div><CreditCard className="text-orange-500" /></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><button onClick={() => setPaymentMethod('vodafone_cash')} className={`payment-option ${paymentMethod === 'vodafone_cash' ? 'active' : ''}`} data-testid="button-payment-vodafone"><span className="payment-mark bg-red-500">V</span><span>فودافون كاش</span><Check className={paymentMethod === 'vodafone_cash' ? 'mr-auto text-orange-600' : 'mr-auto invisible'} size={17} /></button><button onClick={() => setPaymentMethod('instapay')} className={`payment-option ${paymentMethod === 'instapay' ? 'active' : ''}`} data-testid="button-payment-instapay"><span className="payment-mark bg-sky-700">i</span><span>إنستاباي</span><Check className={paymentMethod === 'instapay' ? 'mr-auto text-orange-600' : 'mr-auto invisible'} size={17} /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="field-label">رقم العملية<input value={transactionRef} onChange={(event) => setTransactionRef(event.target.value)} placeholder="مثال: TXN8A21" data-testid="input-transaction-ref" /></label><label className="field-label">رقم المحفظة / الهاتف<input value={senderPhone} onChange={(event) => setSenderPhone(event.target.value)} placeholder="01xxxxxxxxx" data-testid="input-sender-phone" /></label></div><button onClick={submitPayment} disabled={transactionRef.length < 3 || senderPhone.length < 8 || pay.isPending} className="mt-7 w-full rounded-xl bg-orange-500 py-3.5 font-extrabold text-slate-950 disabled:opacity-40" data-testid="button-submit-payment">{pay.isPending ? 'جاري إرسال الدفع...' : 'تأكيد الدفع وإصدار التذكرة'}</button></section>}
  </div><aside className="h-fit rounded-2xl bg-slate-950 p-6 text-white lg:sticky lg:top-6"><h2 className="font-bold text-sky-50">ملخص الحجز</h2><div className="mt-5 space-y-3 border-b border-white/10 pb-5 text-sm"><div className="flex justify-between text-sky-100/60"><span>المقاعد</span><span className="font-bold text-white">{selected.length || '—'}</span></div><div className="flex justify-between text-sky-100/60"><span>سعر المقاعد</span><span className="font-bold text-white">{money(trip.price * selected.length)}</span></div>{pickup === 'توصيل منزلي' && <div className="flex justify-between text-sky-100/60"><span>توصيل منزلي</span><span className="font-bold text-white">٣٥ جنيه</span></div>}</div><div className="mt-5 flex items-end justify-between"><span className="text-sm text-sky-100/60">الإجمالي</span><strong className="text-2xl text-orange-400" data-testid="text-booking-total">{money(total)}</strong></div><p className="mt-6 flex gap-2 text-[11px] leading-5 text-sky-100/45"><ShieldCheck size={15} className="shrink-0 text-orange-400" /> بياناتك مشفرة ومحمية. لا نحتفظ ببيانات الدفع.</p></aside></div></main></Page>;
}

function TicketPage() {
  const params = useParams();
  const reference = params.reference || '';
  const bookingQuery = useGetBooking(reference, { query: { enabled: Boolean(reference), queryKey: getGetBookingQueryKey(reference) } });
  const booking = bookingQuery.data;
  if (bookingQuery.isLoading) return <Page><div className="we-section py-16"><div className="mx-auto h-80 max-w-2xl skeleton rounded-3xl" /></div></Page>;
  if (bookingQuery.isError || !booking) return <Page><div className="we-section py-24"><ErrorState /></div></Page>;
  return <Page><main className="we-section py-10 md:py-16"><div className="mx-auto max-w-2xl"><div className="mb-7 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check size={28} /></div><h1 className="mt-4 font-display text-3xl font-extrabold">حجزك اتأكد!</h1><p className="mt-2 text-sm text-slate-500">احتفظ بالتذكرة دي واعرضها عند الصعود.</p></div><div className="overflow-hidden rounded-3xl bg-white shadow-lg"><div className="relative bg-slate-950 p-7 text-white"><div className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-[#edf9fc]" /><div className="absolute -bottom-3 -right-3 h-6 w-6 rounded-full bg-[#edf9fc]" /><div className="flex items-center justify-between"><Logo compact /><Status tone="green">مدفوع</Status></div><p className="mt-8 text-xs text-sky-100/50">رقم الحجز</p><strong className="mt-1 block font-mono text-2xl tracking-widest text-orange-400" data-testid="text-booking-reference">{booking.reference}</strong></div><div className="p-7"><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4"><div><p className="text-xs text-slate-400">من</p><strong className="mt-1 block text-xl">{booking.trip.from}</strong><span className="text-xs text-slate-500">{timeText(booking.trip.departure)}</span></div><div className="flex flex-col items-center text-orange-500"><ArrowLeft size={24} /><span className="mt-1 text-[10px] text-slate-400">{booking.trip.duration}</span></div><div className="text-left"><p className="text-xs text-slate-400">إلى</p><strong className="mt-1 block text-xl">{booking.trip.to}</strong><span className="text-xs text-slate-500">{timeText(booking.trip.arrival)}</span></div></div><div className="my-7 border-t border-dashed border-slate-200" /><div className="grid grid-cols-2 gap-y-5 text-sm"><div><p className="text-xs text-slate-400">المسافر</p><strong>{booking.customer.name}</strong></div><div><p className="text-xs text-slate-400">المقاعد</p><strong>{booking.seats.join('، ')}</strong></div><div><p className="text-xs text-slate-400">التاريخ</p><strong>{dateText(booking.trip.departure)}</strong></div><div><p className="text-xs text-slate-400">الإجمالي</p><strong>{money(booking.total)}</strong></div></div><div className="mt-7 rounded-xl bg-sky-50 p-4 text-center text-xs text-slate-500">يرجى الحضور قبل موعد التحرك بـ ١٥ دقيقة</div></div></div><div className="mt-6 flex justify-center gap-3"><Link href="/account" className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold" data-testid="link-ticket-account">رحلاتي</Link><Link href="/trips" className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-extrabold text-slate-950" data-testid="link-new-booking">حجز جديد</Link></div></div></main></Page>;
}

function Account() {
  return <Page><main className="we-section py-10 md:py-14"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold text-orange-600">أهلاً بك من جديد</p><h1 className="mt-1 font-display text-3xl font-extrabold">رحلاتي</h1></div><div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-sm"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-700">م</span> محمد أحمد <ChevronDown size={15} /></div></div><div className="mt-8 grid gap-5 lg:grid-cols-[1fr_310px]"><section className="rounded-2xl border border-sky-900/10 bg-white p-5 shadow-sm md:p-7"><div className="flex items-center justify-between"><h2 className="font-bold">الحجز القادم</h2><Status tone="green">مؤكد</Status></div><div className="mt-5 rounded-2xl bg-sky-50 p-5"><div className="flex items-center justify-between"><div><span className="text-xs text-slate-500">الخميس، ٢٤ أكتوبر</span><h3 className="mt-2 text-xl font-extrabold">القاهرة <ArrowLeft className="mx-2 inline text-orange-500" size={16} /> الإسكندرية</h3></div><Ticket className="text-orange-500" size={29} /></div><div className="mt-6 flex justify-between border-t border-sky-900/10 pt-4 text-xs text-slate-500"><span>المغادرة ٠٧:٣٠ ص · محطة رمسيس</span><Link href="/ticket/WH-2408" className="font-bold text-orange-600" data-testid="link-view-ticket">عرض التذكرة</Link></div></div></section><aside className="rounded-2xl bg-slate-950 p-6 text-white"><h2 className="font-bold">محتاج مساعدة؟</h2><p className="mt-2 text-sm leading-7 text-sky-100/60">فريقنا موجود يومياً من ٧ صباحاً حتى ١١ مساءً.</p><button className="mt-5 flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-extrabold text-slate-950" data-testid="button-support"><Headphones size={16} /> كلم الدعم</button></aside></div><section className="mt-8 rounded-2xl border border-sky-900/10 bg-white p-5 shadow-sm md:p-7"><div className="flex items-center justify-between"><h2 className="font-bold">آخر التنبيهات</h2><button className="text-xs font-bold text-orange-600" data-testid="button-mark-notifications">تحديد كمقروء</button></div><div className="mt-4 flex gap-3 border-t border-slate-100 py-4"><div className="rounded-xl bg-orange-100 p-2.5 text-orange-600"><BellIcon /></div><div><p className="text-sm font-bold">موعد رحلتك قرب</p><p className="mt-1 text-xs text-slate-500">تذكير: رحلتك إلى الإسكندرية غداً الساعة ٠٧:٣٠ ص.</p></div></div></section></main></Page>;
}
function BellIcon() { return <span className="block h-4 w-4 rounded-t-full border-2 border-orange-600 border-b-0" />; }

function StaffShell({ children }: { children: ReactNode }) {
  return <Page staff><main className="we-section py-8 md:py-12"><div className="mb-8 flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-3"><span className="rounded-lg bg-orange-500 p-2 text-slate-950"><Bus size={18} /></span><div><p className="text-xs font-bold tracking-wide text-orange-600">وحدة / العمليات</p><h1 className="font-display text-3xl font-extrabold">مركز التشغيل</h1></div></div></div><div className="flex items-center gap-2 text-xs font-bold text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-500" /> النظام يعمل بشكل طبيعي <Link href="/" className="mr-3 text-orange-600" data-testid="link-exit-staff">واجهة العملاء</Link></div></div>{children}</main></Page>;
}

function StaffNav() {
  return <nav className="mb-6 flex gap-2 overflow-x-auto rounded-xl bg-white p-1.5 shadow-sm"><Link href="/staff" className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold hover:bg-sky-50" data-testid="staff-nav-dashboard">نظرة عامة</Link><Link href="/staff/bookings" className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold hover:bg-sky-50" data-testid="staff-nav-bookings">الحجوزات</Link><Link href="/staff/trips" className="whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold hover:bg-sky-50" data-testid="staff-nav-trips">الرحلات</Link></nav>;
}

function StaffDashboard() {
  const dashboard = useGetStaffDashboard({ query: { queryKey: getGetStaffDashboardQueryKey() } });
  const data = dashboard.data;
  return <StaffShell><StaffNav />{dashboard.isLoading ? <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-28 skeleton rounded-2xl" />)}</div> : dashboard.isError ? <ErrorState onRetry={() => void dashboard.refetch()} /> : data ? <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[['رحلات اليوم', data.todayTrips, 'text-sky-700'], ['حجوزات جديدة', data.newBookings, 'text-orange-600'], ['مدفوعات معلقة', data.pendingPayments, 'text-amber-600'], ['طلبات توصيل', data.pendingPickups, 'text-violet-600'], ['مقاعد متاحة', data.freeSeats, 'text-emerald-600'], ['إيراد اليوم', money(data.todayRevenue), 'text-slate-950']].map(([label, value, tone], index) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-500">{label}</span><span className={`text-2xl font-extrabold ${tone}`}>{value}</span></div><div className="mt-4 h-1 rounded-full bg-slate-100"><div className={`h-1 rounded-full ${index === 1 ? 'w-2/3 bg-orange-500' : 'w-1/2 bg-sky-500'}`} /></div></div>)}</div><div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-bold">يحتاج انتباهك</h2><Link href="/staff/bookings" className="text-xs font-bold text-orange-600" data-testid="link-dashboard-bookings">كل الحجوزات</Link></div><div className="mt-4 space-y-3">{data.attention?.length ? data.attention.map((item: any, index: number) => <div key={index} className="flex items-center gap-3 rounded-xl bg-slate-50 p-4"><span className={`h-2.5 w-2.5 rounded-full ${item.tone === 'danger' ? 'bg-red-500' : 'bg-orange-500'}`} /><div><p className="text-sm font-bold">{item.title}</p><p className="mt-1 text-xs text-slate-500">{item.subtitle}</p></div><ArrowLeft className="mr-auto text-slate-300" size={16} /></div>) : <p className="py-6 text-center text-sm text-slate-500">لا توجد تنبيهات حالياً.</p>}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-bold">الإيراد هذا الأسبوع</h2><div className="mt-6 flex h-40 items-end gap-2">{(data.revenue || []).map((item: any, index: number) => <div key={item.label} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-lg bg-orange-400" style={{ height: `${Math.max(16, Math.min(100, (item.value / Math.max(...(data.revenue || [{ value: 1 }]).map((entry: any) => entry.value))) * 100))}%` }} /><span className="text-[10px] text-slate-400">{item.label}</span></div>)}</div></section></div></> : <ErrorState />}</StaffShell>;
}

function StaffBookings() {
  const [status, setStatus] = useState('pending_payment');
  const bookingsQuery = useListStaffBookings({ status }, { query: { queryKey: getListStaffBookingsQueryKey({ status }) } });
  const review = useReviewBookingPayment();
  const reviewBooking = (id: number, decision: 'approve' | 'reject') => review.mutate({ bookingId: id, data: { decision, reason: decision === 'reject' ? 'بيانات الدفع غير مطابقة' : null } }, { onSuccess: () => void bookingsQuery.refetch() });
  return <StaffShell><StaffNav /><div className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold">طابور الحجوزات</h2><p className="mt-1 text-xs text-slate-500">راجع المدفوعات وأكّد المقاعد قبل موعد الرحلة.</p></div><div className="flex gap-2">{[['pending_payment', 'مدفوعات معلقة'], ['confirmed', 'مؤكدة'], ['all', 'الكل']].map(([value, label]) => <button key={value} onClick={() => setStatus(value)} className={`rounded-lg px-3 py-2 text-xs font-bold ${status === value ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`} data-testid={`button-booking-status-${value}`}>{label}</button>)}</div></div>{bookingsQuery.isLoading ? <div className="space-y-2 p-5"><div className="h-14 skeleton rounded-lg" /><div className="h-14 skeleton rounded-lg" /></div> : bookingsQuery.isError ? <div className="p-5"><ErrorState onRetry={() => void bookingsQuery.refetch()} /></div> : bookingsQuery.data?.length ? <div className="divide-y divide-slate-100">{bookingsQuery.data.map((booking: any) => <div key={booking.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-center" data-testid={`row-booking-${booking.id}`}><div className="flex-1"><div className="flex items-center gap-3"><strong className="font-mono text-sm">{booking.reference}</strong><Status tone={booking.paymentStatus === 'paid' ? 'green' : 'orange'}>{booking.paymentStatus === 'paid' ? 'مدفوع' : 'بانتظار الدفع'}</Status></div><p className="mt-2 text-sm font-bold">{booking.customer?.name} · {booking.trip?.from} إلى {booking.trip?.to}</p><p className="mt-1 text-xs text-slate-500">{booking.seats?.length} مقاعد · {money(booking.total)} · {booking.customer?.phone}</p></div>{status === 'pending_payment' && <div className="flex gap-2"><button disabled={review.isPending} onClick={() => reviewBooking(booking.id, 'reject')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600" data-testid={`button-reject-${booking.id}`}>رفض</button><button disabled={review.isPending} onClick={() => reviewBooking(booking.id, 'approve')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white" data-testid={`button-approve-${booking.id}`}>تأكيد الدفع</button></div>}</div>)}</div> : <div className="p-14 text-center text-sm text-slate-500"><FileText className="mx-auto mb-3 text-slate-300" />لا توجد حجوزات في هذا القسم.</div>}</div></StaffShell>;
}

function StaffTrips() {
  const tripsQuery = useListTrips({}, { query: { queryKey: getListTripsQueryKey({}) } });
  return <StaffShell><StaffNav /><div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">لوحة الرحلات</h2><p className="mt-1 text-xs text-slate-500">المواعيد وحالة المقاعد للرحلات القادمة.</p></div><button className="flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-bold text-white" data-testid="button-refresh-trips" onClick={() => void tripsQuery.refetch()}><RefreshCw size={14} /> تحديث</button></div>{tripsQuery.isLoading ? <TripSkeleton /> : tripsQuery.isError ? <ErrorState onRetry={() => void tripsQuery.refetch()} /> : <div className="grid gap-4 md:grid-cols-2">{(tripsQuery.data || []).map((trip: any) => <div key={trip.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><Status tone={trip.seatsLeft < 8 ? 'orange' : 'green'}>{trip.status || 'متاحة'}</Status><span className="font-mono text-xs text-slate-400">#{trip.id}</span></div><h3 className="mt-4 text-lg font-extrabold">{trip.from} <ArrowLeft className="mx-1 inline text-orange-500" size={15} /> {trip.to}</h3><p className="mt-1 text-sm text-slate-500">{dateText(trip.departure)} · {timeText(trip.departure)} — {timeText(trip.arrival)}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="text-xs text-slate-500">{trip.busType}</span><strong className={trip.seatsLeft < 8 ? 'text-orange-600' : 'text-emerald-600'}>{trip.seatsLeft} / {trip.totalSeats} مقعد متاح</strong></div></div>)}</div>}</StaffShell>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={Home} /><Route path="/trips" component={Trips} /><Route path="/book/:tripId" component={BookingPage} /><Route path="/ticket/:reference" component={TicketPage} /><Route path="/account" component={Account} /><Route path="/staff/bookings" component={StaffBookings} /><Route path="/staff/trips" component={StaffTrips} /><Route path="/staff" component={StaffDashboard} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;