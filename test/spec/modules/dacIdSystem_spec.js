import {
  dacIdSystemSubmodule,
  storage,
  FUUID_COOKIE_NAME,
  AONEID_COOKIE_NAME
} from 'modules/dacIdSystem.js';

const FUUID_DUMMY_VALUE = 'dacIdTest';
const AONEID_DUMMY_VALUE = '12345'
const DACID_DUMMY_OBJ = {
  fuuid: FUUID_DUMMY_VALUE,
  uid: AONEID_DUMMY_VALUE
};

describe('dacId module', function () {
  let getCookieStub;

  beforeEach(function (done) {
    getCookieStub = sinon.stub(storage, 'getCookie');
    done();
  });

  afterEach(function () {
    getCookieStub.restore();
  });

  const cookieTestCasesForEmpty = [
    undefined,
    null,
    ''
  ]

  const configParamTestCase = {
    params: {
      oid: [
        '637c1b6fc26bfad0', // valid
        'e8316b39c08029e1' // invalid
      ]
    }
  }

  describe('getId()', function () {
    it('should return undefined when oid and fuuid not exist', function () {
      // no oid, no fuuid
      const id = dacIdSystemSubmodule.getId();
      expect(id).to.equal(undefined);
    });

    it('should return fuuid when oid not exist but fuuid exist in cookie', function () {
      // no oid, fuuid
      getCookieStub.withArgs(FUUID_COOKIE_NAME).returns(FUUID_DUMMY_VALUE);
      const id = dacIdSystemSubmodule.getId();
      expect(id).to.be.deep.equal({
        id: {
          fuuid: FUUID_DUMMY_VALUE,
          uid: undefined
        }
      });
    });

    it('should return fuuid when oid is invalid', function () {
      // invalid oid, fuuid, no AoneId
      getCookieStub.withArgs(FUUID_COOKIE_NAME).returns(FUUID_DUMMY_VALUE);
      const id = dacIdSystemSubmodule.getId(configParamTestCase.params.oid[1]);
      expect(id).to.be.deep.equal({
        id: {
          fuuid: FUUID_DUMMY_VALUE,
          uid: undefined,
        }
      });
    });

    cookieTestCasesForEmpty.forEach(testCase => it('should return undefined when fuuid not exists in cookie', function () {
      // valid oid, no fuuid, no AoneId
      getCookieStub.withArgs(FUUID_COOKIE_NAME).returns(testCase);
      const id = dacIdSystemSubmodule.getId(configParamTestCase.params.oid[0]);
      expect(id).to.equal(undefined);
    }));

    cookieTestCasesForEmpty.forEach(testCase => it('should return callback when AoneId not exists in cookie', function () {
      // valid oid, fuuid, no AoneId
      getCookieStub.withArgs(FUUID_COOKIE_NAME).returns(FUUID_DUMMY_VALUE);
      getCookieStub.withArgs(AONEID_COOKIE_NAME).returns(testCase);
      const callback = dacIdSystemSubmodule.getId(configParamTestCase.params.oid[0]);
      const id = callback(configParamTestCase.params.oid[0], FUUID_DUMMY_VALUE);
      expect(id).to.be.deep.equal({
        id: {
          fuuid: FUUID_DUMMY_VALUE,
          uid: undefined
        }
      });
    }));

    it('should return the fuuid & AoneId when they exist in cookie', function () {
      // valid oid, fuuid, AoneId
      getCookieStub.withArgs(FUUID_COOKIE_NAME).returns(FUUID_DUMMY_VALUE);
      getCookieStub.withArgs(AONEID_COOKIE_NAME).returns(AONEID_DUMMY_VALUE);
      const id = dacIdSystemSubmodule.getId(configParamTestCase.params.oid[0]);
      expect(id).to.be.deep.equal({
        id: {
          fuuid: FUUID_DUMMY_VALUE,
          uid: AONEID_DUMMY_VALUE
        }
      });
    });
  });

  describe('decode()', function () {
    it('should return the uid when they exists in cookie', function () {
      // fuuid, aoneid
      const decoded = dacIdSystemSubmodule.decode(DACID_DUMMY_OBJ);
      expect(decoded).to.be.deep.equal({
        fuuid: FUUID_DUMMY_VALUE,
        dacId: AONEID_DUMMY_VALUE
      });
    });

    it('should return the undefined when decode id is not "string"', function () {
      const decoded = dacIdSystemSubmodule.decode(1);
      expect(decoded).to.equal(undefined);
    });
  });
});
