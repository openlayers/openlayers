"""Script to generate MC tests for Closure SHA functions"""

from binascii import hexlify
from hashlib import sha1, sha224, sha256, sha384, sha512

from Crypto.Cipher import AES

C = AES.new('Closure Library SHA KATs        ')
MC_START = ''.join(C.encrypt(('MC' * 15) + '\x00' + chr(i)) for i in range(16))


TEST_TEMPLATE = '''\
function test{shatitle}() {{
  var sha = new goog.crypt.{shatitle}();
  var initial_state = '{initial_state}';
  var count = {count};
  var state = goog.crypt.stringToByteArray(initial_state);
  var digest;
  for (var i = 0; i < count; i++) {{
    sha.reset();
    sha.update(state);
    digest = sha.digest();
    state = goog.array.concat(digest, state);
  }}
  assertEquals({lenfinal}, state.length);
  assertEquals('{expected}',
    goog.crypt.byteArrayToHex(digest));
  sha.reset();
  for (var i = 0; i < ({lenfinal} + 10); i++) {{
    sha.update(state, i);
  }}
  assertEquals('{expected2}',
    goog.crypt.byteArrayToHex(sha.digest()));
}}
'''

def genmc(sha, name, blocklen, digestlen):
    """Generate a Monte Carlo test for each SHA instance."""
    count = (2 ** 15) // digestlen
    state = name
    for i in range(count):
        digest = sha(state).digest()
        state = digest + state
    final_state = state
    lenfinal = len(final_state)
    h = sha()
    for i in range(len(final_state) + 10):
        h.update(final_state[:i])
    print(TEST_TEMPLATE.format(initial_state=name, count=count,
                               lenfinal=len(final_state),
                               expected=hexlify(digest),
                               shatitle=name,
                               expected2=hexlify(h.digest())))


SHAS = [(sha1, 'Sha1', 64, 160//8),
        (sha224, 'Sha224', 64, 224//8),
        (sha256, 'Sha256', 64, 256//8),
        (sha384, 'Sha384', 128, 384//8),
        (sha512, 'Sha512', 128, 512//8)]

for s in SHAS:
    genmc(*s)
