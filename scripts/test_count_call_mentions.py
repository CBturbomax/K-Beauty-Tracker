import importlib.util,json,unittest
from pathlib import Path
spec=importlib.util.spec_from_file_location('counter',Path(__file__).with_name('count-call-mentions.py'));counter=importlib.util.module_from_spec(spec);spec.loader.exec_module(counter)
class MentionCountingTests(unittest.TestCase):
 def test_literal_not_sentences(self):
  d=counter.count('[10-20] K-beauty drives our K-beauty sales.',15)
  self.assertEqual(d['counts']['direct'],2)
  self.assertEqual(d['moments'][0]['count'],2)
 def test_variants_and_word_boundaries(self):
  d=counter.count('K-BEAUTY, k beauty, Kbeauty, K–beauty. K-beautiful is not a match.')
  self.assertEqual(d['counts']['direct'],4)
 def test_sections_and_labels(self):
  d=counter.count('[Paragraph 0] Speaker K-beauty:\n[1-2] K-beauty.\n[20-22] Medicube and K beauty.',10)
  self.assertEqual(d['counts']['direct'],2)
  self.assertEqual(d['terms'][0]['prepared'],1);self.assertEqual(d['terms'][0]['qna'],1)
 def test_general_separate_from_names(self):
  d=counter.count('Ulta Beauty. e.l.f. Beauty. K-beauty. Korean beauty. Beauty of Joseon. Beauty and skincare and cosmetics.')
  self.assertEqual(d['counts']['general'],3);self.assertEqual(d['counts']['brands'],1)
 def test_real_august_2026_repeated_phrase(self):
  docs=json.loads(Path('data/call-frequency.json').read_text())['documents'];d=next(x for x in docs if x['id']=='194083')
  term=next(t for t in d['terms'] if t['term']=='K-beauty');moments=[x for x in d['moments'] if x['term']=='K-beauty']
  self.assertEqual(term['count'],17);self.assertEqual(len(moments),16);self.assertEqual(sum(x['count'] for x in moments),17)
 def test_korean_cosmetics_context_and_brands(self):
  d=counter.count('Korean brands. Korean makeup brand. Brands from Korea. Numbuzin, Centellian24, Peach & Lily. Manufacturing is in Italy and South Korea.',source_id='63990')
  self.assertEqual(d['counts']['direct'],4)
  self.assertEqual(d['counts']['brands'],3)
 def test_unrelated_korean_market_excluded(self):
  d=counter.count('Our stores in Korea. Korean won. Sales in Korea. Non-Korean brands.')
  self.assertEqual(d['counts']['direct'],0)
 def test_missing_is_not_zero(self):
  docs=json.loads(Path('data/call-frequency.json').read_text())['documents']
  for d in docs:
   if d['status']!='complete':self.assertNotIn('counts',d)
   else:
    for category,total in d['counts'].items():self.assertEqual(total,sum(t['count'] for t in d['terms'] if t['category']==category))
  ulta=[d for d in docs if d['company']=='Ulta Beauty'];self.assertEqual(len(ulta),23);self.assertTrue(all(d['status']=='complete' for d in ulta))
if __name__=='__main__':unittest.main()
