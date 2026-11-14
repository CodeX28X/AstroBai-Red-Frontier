import type { FacilityId } from '../../types/marsMap';

/** Small, intentionally placed props: the crew leaves traces of everyday life. */
export function RoomDetails({ id }: { id: FacilityId }) {
  return <g>
    {/* Entry mat and dusty boot prints, shared by the connected outpost rooms. */}
    <path d="M340 383H431V411H340Z" fill="#4c6969"/><path d="M349 388H423M349 395H423M349 402H423" stroke="#a6b39a" strokeWidth="2"/>
    <path d="M371 363H376V371H371ZM386 352H391V360H386ZM374 340H379V348H374Z" fill="#b89b79" opacity=".7"/>
    {id === 'habitat' && <>
      {/* A rug, mismatched blankets, a little plush and taped-up family pictures. */}
      <path d="M112 277H308V368H112Z" fill="#ad7760"/><path d="M118 283H302V362H118Z" fill="#d5b181"/><path d="M124 291H296V354H124Z" fill="#8d7770"/><path d="M135 305H285M135 340H285" stroke="#c6ab88" strokeWidth="3"/>
      <path d="M150 188H267V214H150Z" fill="#c89071"/><path d="M160 191H172V213H160ZM191 191H203V213H191Z" fill="#e0b38a"/>
      <path d="M245 153H253V158H260V170H243V159H245Z" fill="#bd8f64"/><path d="M243 150H247V157H243ZM256 150H260V157H256Z" fill="#bd8f64"/><path d="M246 160H249V163H246ZM255 160H258V163H255Z" fill="#3b4850"/>
      <path d="M190 62H224V96H190Z" fill="#ddc6a2"/><path d="M194 66H220V92H194Z" fill="#789da1"/><path d="M200 79H206V90H200ZM211 76H217V90H211Z" fill="#e5bd8b"/><path d="M187 60H200V64H187ZM214 94H228V98H214Z" fill="#c2b480"/>
      <path d="M239 68H270V91H239Z" fill="#d3b58e"/><path d="M244 72H265V86H244Z" fill="#587b7e"/><path d="M247 79H262V83H247Z" fill="#91ae8f"/>
      <path d="M585 163H598V177H585ZM598 166H603V173H598Z" fill="#759fa1"/><path d="M587 162H596V165H587Z" fill="#344d59"/>
      <path d="M530 190H557V205H530Z" fill="#f0d9ac"/><path d="M534 194H550V196H534ZM534 199H544V201H534Z" fill="#7f8d80"/>
      <path d="M108 110H136V130H108Z" fill="#c3ad84"/><path d="M117 94H123V111H117ZM107 98H119V104H107ZM123 89H135V99H123Z" fill="#91b07e"/>
      <path d="M113 231H126V248H113ZM130 231H143V248H130Z" fill="#6c5d52"/>
    </>}
    {id === 'research-lab' && <>
      {/* A working notebook, sample labels, a pinned sketch, and a wheeled stool. */}
      <path d="M307 78H405V120H307Z" fill="#c7be9c"/><path d="M313 84H399V114H313Z" fill="#e7d8af"/><path d="M326 105L337 91L350 105L363 94L380 105Z" stroke="#7e8d86" strokeWidth="2" fill="none"/><path d="M310 76H323V80H310ZM386 116H402V120H386Z" fill="#91b4ab"/>
      <path d="M647 185H679V206H647Z" fill="#eee0ba"/><path d="M651 189H675V191H651ZM651 196H667V198H651Z" fill="#6c8585"/><path d="M642 182L681 202" stroke="#c78260" strokeWidth="3"/>
      <path d="M108 200H125V206H108ZM153 200H170V206H153ZM199 200H216V206H199Z" fill="#f6dfae"/>
      <path d="M633 340H662V361H633Z" fill="#8eaba6"/><path d="M638 344H658V346H638ZM638 351H653V353H638Z" fill="#2f5865"/>
      <path d="M576 414H600V430H576Z" fill="#304d5d"/><path d="M580 410H596V423H580Z" fill="#7b9ca1"/><path d="M585 431H590V442H585ZM576 442H600V446H576Z" fill="#48616c"/>
      <path d="M80 304H153V337H80Z" fill="#8b755f"/><path d="M84 308H149V330H84Z" fill="#b4a17b"/><path d="M94 308V330M139 308V330" stroke="#70695c" strokeWidth="3"/>
      <path d="M159 305H176V326H159Z" fill="#c2c2a2"/><path d="M163 309H172V312H163Z" fill="#668d85"/>
    </>}
    {id === 'greenhouse' && <>
      {/* Uneven growth, a curled hose, spilled soil and a pot waiting to be planted. */}
      <path d="M110 154H120V161H110ZM171 183H183V190H171ZM252 146H264V156H252Z" fill="#749c62"/>
      <path d="M278 212H294V216H278ZM285 220H300V224H285ZM272 229H278V232H272Z" fill="#6f5b48"/>
      <path d="M524 252H560V261H570V281H560V289H525V282H516V261H524Z" stroke="#55786f" strokeWidth="6" fill="none"/><path d="M528 264H555V279H528Z" stroke="#55786f" strokeWidth="4" fill="none"/>
      <path d="M114 316H148L143 343H119Z" fill="#c58a62"/><path d="M111 311H151V318H111Z" fill="#dfa976"/><path d="M119 315H143V319H119Z" fill="#6a5646"/>
      <path d="M177 315H200V333H177ZM200 320H207V329H200ZM173 316H177V325H168V321H173Z" fill="#7aacab"/>
      <path d="M335 80H374V116H335Z" fill="#ddcfa8"/><path d="M352 88V106M341 94H352M352 101H365" stroke="#719477" strokeWidth="3"/>
      <path d="M614 383H643V389H614Z" fill="#486470"/><path d="M640 379H653V393H640Z" fill="#a9b5a0"/>
    </>}
    {id === 'solar-array' && <>
      {/* Cable reels, a tool outline, a patched floor panel and a worn warning stripe. */}
      <path d="M100 292H159V337H100Z" fill="#415d65"/><path d="M108 299H151V330H108Z" fill="#a39172"/><path d="M115 304H144V324H115Z" fill="#435963"/><path d="M126 304H133V324H126Z" fill="#b8ad89"/>
      <path d="M188 297H219V330H188Z" fill="#bf9667"/><path d="M193 303H214V324H193Z" fill="#6c6355"/>
      <path d="M316 78H386V117H316Z" fill="#304b59"/><path d="M327 89H340V94H335V108H330V94H327ZM355 88H363V100H371V108H350V100H355Z" fill="#8aaca8"/>
      <path d="M285 260H350V306H285Z" fill="#6b817b"/><path d="M291 266H344V300H291Z" fill="#84978b"/><path d="M295 270H300V274H295ZM336 292H341V296H336Z" fill="#c5c0a0"/>
      <path d="M489 405H688V414H489Z" fill="#3a4c51"/><path d="M496 405H510L504 414H490ZM531 405H545L539 414H525ZM566 405H580L574 414H560ZM601 405H615L609 414H595ZM636 405H650L644 414H630Z" fill="#cfb272"/>
      <path d="M654 351H667V365H654Z" fill="#c4815f"/><path d="M658 353H663V356H658Z" fill="#f0cd8c"/>
    </>}
  </g>;
}
