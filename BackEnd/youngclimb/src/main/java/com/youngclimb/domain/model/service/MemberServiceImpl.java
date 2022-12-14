package com.youngclimb.domain.model.service;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.youngclimb.common.exception.ForbiddenException;
import com.youngclimb.common.jwt.JwtTokenProvider;
import com.youngclimb.common.redis.RedisService;
import com.youngclimb.domain.model.dto.TokenDto;
import com.youngclimb.domain.model.dto.board.NoticeDto;
import com.youngclimb.domain.model.dto.member.*;
import com.youngclimb.domain.model.entity.*;
import com.youngclimb.domain.model.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.persistence.EntityExistsException;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final MemberRepository memberRepository;
    private final FollowRepository followRepository;
    private final MemberRankExpRepository memberRankExpRepository;
    private final RankRepository rankRepository;
    private final MemberProblemRepository memberProblemRepository;
    private final NoticeRepository noticeRepository;
    private final AmazonS3 amazonS3;
    private final RedisService redisService;



    // ????????? ?????? ??????
    @Override
    public boolean checkEmailDuplicate(MemberEmail email) {
        return !memberRepository.existsByEmail(email.getEmail());
    }

    // ????????? ?????? ??????
    @Override
    public boolean checkNicknameDuplicate(MemberNickname nickname) {
        return !memberRepository.existsByNickname(nickname.getNickname());
    }

    // ?????? ??????
    @Override
    public LoginResDto insertUser(JoinMember joinMember) throws Exception {
        if (memberRepository.existsByEmail(joinMember.getEmail())) {
            System.out.println("????????? ?????????");
            throw new EntityExistsException("????????? ??????????????????!");
        }

        if (!isEmail(joinMember.getEmail())) {
            System.out.println("????????? ??????");
            throw new Exception("????????? ????????? ???????????????.");
        }

        if (memberRepository.existsByNickname(joinMember.getNickname())) {
            System.out.println("????????? ?????????");
            throw new EntityExistsException("????????? ??????????????????!");
        }

        Integer memberWingHeight = 0;

        if (joinMember.getHeight() == 0 || joinMember.getWingspan() == 0) {
            memberWingHeight = (joinMember.getHeight() + joinMember.getWingspan()) * 2;
        } else {
            memberWingHeight = joinMember.getHeight() + joinMember.getWingspan();
        }


        Member member = Member.builder()
                .memberProfileImg("https://youngclimb.s3.ap-northeast-2.amazonaws.com/userProfile/KakaoTalk_20221108_150615819.png")
                .email(joinMember.getEmail())
                .pw(passwordEncoder.encode(joinMember.getPassword()))
                .nickname(joinMember.getNickname())
                .gender(joinMember.getGender())
                .joinDate(LocalDate.now())
                .height(joinMember.getHeight())
                .shoeSize(joinMember.getShoeSize())
                .wingspan(joinMember.getWingspan())
                .wingheight(memberWingHeight)
                .role(UserRole.USER)
                .fcmToken(joinMember.getFcmToekn())
                .lastActive(LocalDateTime.now())
                .build();
        if (member == null) System.out.println("?????? ?????? ??????");
        memberRepository.save(member);

        LoginMemberInfo user = LoginMemberInfo.builder()
                .nickname(member.getNickname())
                .intro(member.getProfileContent())
                .image(member.getMemberProfileImg())
                .height(member.getHeight())
                .shoeSize(member.getShoeSize())
                .wingspan(member.getWingspan())
                .rank("Y1")
                .exp(0)
                .expleft(20)
                .upto(0)
                .build();

        MemberRankExp memberRankExp = MemberRankExp.builder()
                .member(member)
                .memberExp(0L)
                .rank(rankRepository.findByName("Y1").orElse(new Rank()))
                .build();
        memberRankExpRepository.save(memberRankExp);

        MemberProblem memberProblem = MemberProblem.builder()
                .member(member)
                .vB(0).v0(0).v1(0).v2(0).v3(0).v4(0).v5(0).v6(0).v7(0).v8(0)
                .build();
        memberProblemRepository.save(memberProblem);

        LoginResDto loginResDto = LoginResDto.builder()
                .refreshToken(jwtTokenProvider.createRefreshToken(member.getEmail()))
                .accessToken(jwtTokenProvider.createAccessToken(member.getEmail()))
                .user(user)
                .build();

        return loginResDto;
    }

    // ????????? ??????
    @Override
    public LoginResDto addProfile(String email, MemberProfile memberProfile) throws Exception {

        Member member = memberRepository.findByEmail(email).orElseThrow();

        if (memberProfile.getImage() == "") {
            memberProfile.setImage("https://youngclimb.s3.ap-northeast-2.amazonaws.com/userProfile/KakaoTalk_20221108_150615819.png");
        }

        // ????????? ??????
        member.updateMemberImg(memberProfile);
        memberRepository.save(member);

        MemberRankExp memberRankExp = memberRankExpRepository.findByMember(member).orElseThrow();

        LoginResDto loginResDto = LoginResDto.builder()
                .accessToken(jwtTokenProvider.createAccessToken(member.getEmail()))
                .refreshToken(jwtTokenProvider.createRefreshToken(member.getEmail()))
                .build();

        MemberProblem memberProblem = memberProblemRepository.findByMember(member).orElseThrow();


        int problemLeft = 0;
        switch (memberRankExp.getRank().getProblem()) {
            case "V0":
                problemLeft = (3 > memberProblem.getV0()) ? memberProblem.getV0() : 3;
                break;
            case "V1":
                problemLeft = (3 > memberProblem.getV1()) ? memberProblem.getV1() : 3;
                break;
            case "V3":
                problemLeft = (3 > memberProblem.getV3()) ? memberProblem.getV3() : 3;
                break;
            case "V5":
                problemLeft = (3 > memberProblem.getV5()) ? memberProblem.getV5() : 3;
                break;
            case "V6":
                problemLeft = (3 > memberProblem.getV6()) ? memberProblem.getV6() : 3;
                break;
            case "V7":
                problemLeft = (3 > memberProblem.getV7()) ? memberProblem.getV7() : 3;
                break;
            default:
                problemLeft = 0;
                break;
        }

        long expLeft = memberRankExp.getRank().getQual() - memberRankExp.getMemberExp();

        if (expLeft < 0) {
            expLeft = 0;
        }

        Integer exp = (int) (memberRankExp.getMemberExp() * 100 / memberRankExp.getRank().getQual());

        if (exp > 100) {
            exp = 100;
        }


        LoginMemberInfo loginMem = LoginMemberInfo.builder()
                .nickname(member.getNickname())
                .intro(member.getProfileContent())
                .image(member.getMemberProfileImg())
                .height(member.getHeight())
                .shoeSize(member.getShoeSize())
                .wingspan(member.getWingspan())
                .rank(memberRankExp.getRank().getName())
                .exp(exp)
                .expleft(expLeft)
                .upto(problemLeft)
                .build();
        loginResDto.setUser(loginMem);

        return loginResDto;
    }

    // ????????? ??????
    @Override
    public LoginResDto editProfile(String email, MemberInfo memberInfo) throws Exception {
        Member member = memberRepository.findByEmail(email).orElseThrow();

        if (memberInfo.getImage() == "") {
            memberInfo.setImage("https://youngclimb.s3.ap-northeast-2.amazonaws.com/userProfile/KakaoTalk_20221108_150615819.png");
        }
        member.updateProfile(memberInfo);
        memberRepository.save(member);

        MemberRankExp memberRankExp = memberRankExpRepository.findByMember(member).orElseThrow();

        LoginResDto loginResDto = LoginResDto.builder()
                .accessToken(null)
                .refreshToken(null)
                .build();

        MemberProblem memberProblem = memberProblemRepository.findByMember(member).orElseThrow();


        int problemLeft = 0;
        switch (memberRankExp.getRank().getProblem()) {
            case "V0":
                problemLeft = (3 > (memberProblem.getV0() + memberProblem.getV1() + memberProblem.getV2() + memberProblem.getV3() + memberProblem.getV4() + memberProblem.getV5() + memberProblem.getV6() + memberProblem.getV7() + memberProblem.getV8())) ? memberProblem.getV0() : 3;
                break;
            case "V1":
                problemLeft = (3 > (memberProblem.getV1() + memberProblem.getV2() + memberProblem.getV3() + memberProblem.getV4() + memberProblem.getV5() + memberProblem.getV6() + memberProblem.getV7() + memberProblem.getV8())) ? memberProblem.getV1() : 3;
                break;
            case "V3":
                problemLeft = (3 > (memberProblem.getV3() + memberProblem.getV4() + memberProblem.getV5() + memberProblem.getV6() + memberProblem.getV7() + memberProblem.getV8())) ? memberProblem.getV3() : 3;
                break;
            case "V5":
                problemLeft = (3 > (memberProblem.getV5() + memberProblem.getV6() + memberProblem.getV7() + memberProblem.getV8())) ? memberProblem.getV5() : 3;
                break;
            case "V6":
                problemLeft = (3 > (memberProblem.getV6() + memberProblem.getV7() + memberProblem.getV8())) ? memberProblem.getV6() : 3;
                break;
            case "V7":
                problemLeft = (3 > (memberProblem.getV7() + memberProblem.getV8())) ? memberProblem.getV7() : 3;
                break;
            default:
                problemLeft = 0;
                break;
        }

        long expLeft = memberRankExp.getRank().getQual() - memberRankExp.getMemberExp();

        if (expLeft < 0) {
            expLeft = 0;
        }

        Integer exp = (int) (memberRankExp.getMemberExp() * 100 / memberRankExp.getRank().getQual());

        if (exp > 100) {
            exp = 100;
        }

        LoginMemberInfo loginMem = LoginMemberInfo.builder()
                .nickname(member.getNickname())
                .intro(member.getProfileContent())
                .image(member.getMemberProfileImg())
                .height(member.getHeight())
                .shoeSize(member.getShoeSize())
                .wingspan(member.getWingspan())
                .rank(memberRankExp.getRank().getName())
                .exp(exp)
                .expleft(expLeft)
                .upto(problemLeft)
                .build();
        loginResDto.setUser(loginMem);

        return loginResDto;
    }

    private String createFileName(String fileName) {
        return UUID.randomUUID().toString().concat(getFileExtension(fileName));
    }

    private String getFileExtension(String fileName) {
        try {
            return fileName.substring(fileName.lastIndexOf("."));
        } catch (StringIndexOutOfBoundsException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "????????? ????????? ???????????????");
        }
    }


    @Override
    public void verifyUser(String email, String password) {
    }

    @Override
    public String changePassword(String userId, String password) {
        return null;
    }

    @Override
    public void deleteMember(String email) {

    }


    // ?????? ????????? ??????
    public TokenDto reIssue(String email) {
        TokenDto tokenDto = TokenDto.builder()
                .accessToken(jwtTokenProvider.createAccessToken(email))
                .refreshToken(redisService.getValues("RT "+email))
                .build();

        Member member = memberRepository.findByEmail(email).orElseThrow();
        member.updateLastActive();
        memberRepository.save(member);

        System.out.println("????????? ????????? ????????? ???????????????");
        return tokenDto;
    }


    // ????????? ??????
    @Override
    public LoginResDto login(LoginMember member) {
        Member loginMember = memberRepository.findByEmail(member.getEmail()).orElseThrow();
        if (!passwordEncoder.matches(member.getPassword(), loginMember.getPw())) {
            throw new IllegalArgumentException("????????? ?????????????????????.");
        }

        // ??????????????? ??????
//        if(redisService.getValues("RT " + member.getEmail()) != null) {
//            throw new EntityExistsException("?????? ???????????? ??????????????????.");
//        }

        loginMember.setFcmToken(member.getFcmToken());
        loginMember.updateLastActive();
        memberRepository.save(loginMember);

        MemberRankExp memberRankExp = memberRankExpRepository.findByMember(loginMember).orElseThrow();

        LoginResDto loginResDto = LoginResDto.builder()
                .accessToken(jwtTokenProvider.createAccessToken(member.getEmail()))
                .refreshToken(jwtTokenProvider.createRefreshToken(member.getEmail()))
                .build();

        MemberProblem memberProblem = memberProblemRepository.findByMember(loginMember).orElseThrow();


        int problemLeft = 0;
        switch (memberRankExp.getRank().getProblem()) {
            case "V0":
                problemLeft = (3 > memberProblem.getV0()) ? memberProblem.getV0() : 3;
                break;
            case "V1":
                problemLeft = (3 > memberProblem.getV1()) ? memberProblem.getV1() : 3;
                break;
            case "V3":
                problemLeft = (3 > memberProblem.getV3()) ? memberProblem.getV3() : 3;
                break;
            case "V5":
                problemLeft = (3 > memberProblem.getV5()) ? memberProblem.getV5() : 3;
                break;
            case "V6":
                problemLeft = (3 > memberProblem.getV6()) ? memberProblem.getV6() : 3;
                break;
            case "V7":
                problemLeft = (3 > memberProblem.getV7()) ? memberProblem.getV7() : 3;
                break;
            default:
                problemLeft = 0;
                break;
        }

        long expLeft = memberRankExp.getRank().getQual() - memberRankExp.getMemberExp();

        if (expLeft < 0) {
            expLeft = 0;
        }

        Integer exp = (int) (memberRankExp.getMemberExp() * 100 / memberRankExp.getRank().getQual());

        if (exp > 100) {
            exp = 100;
        }

        LoginMemberInfo loginMem = LoginMemberInfo.builder()
                .nickname(loginMember.getNickname())
                .intro(loginMember.getProfileContent())
                .image(loginMember.getMemberProfileImg())
                .height(loginMember.getHeight())
                .shoeSize(loginMember.getShoeSize())
                .wingspan(loginMember.getWingspan())
                .rank(memberRankExp.getRank().getName())
                .exp(exp)
                .expleft(expLeft)
                .upto(problemLeft)
                .build();
        loginResDto.setUser(loginMem);

        return loginResDto;
    }

    // ????????? ?????????
    @Override
    public LoginResDto adminLogin(LoginMember member) throws ForbiddenException {
        Member loginMember = memberRepository.findByEmail(member.getEmail()).orElseThrow(() -> new NoSuchElementException("???????????? ???????????? ????????????."));

        if (!passwordEncoder.matches(member.getPassword(), loginMember.getPw())) {
            throw new IllegalArgumentException("????????? ?????????????????????.");
        }

        if(!loginMember.getRole().equals(UserRole.ADMIN)) {
            throw new ForbiddenException("????????? ????????? ????????????");
        }

        // ??????????????? ??????
//        if(redisService.getValues("RT " + member.getEmail()) != null) {
//            throw new EntityExistsException("?????? ???????????? ??????????????????.");
//        }

        LoginResDto loginResDto = LoginResDto.builder()
                .accessToken(jwtTokenProvider.createAccessToken(member.getEmail()))
                .refreshToken(jwtTokenProvider.createRefreshToken(member.getEmail()))
                .build();

        return loginResDto;
    }


    // ????????????
    @Override
    public void logout(String email, String accessToken) {

        // FCM ?????? ??????
        Member member = memberRepository.findByEmail(email).orElseThrow();
        member.setFcmToken(null);
        memberRepository.save(member);

        jwtTokenProvider.logout(email, accessToken);
    }

    // ????????? ????????? ??????
    public boolean isEmail(String str) {
        return Pattern.matches("^[a-z0-9A-Z._-]*@[a-z0-9A-Z]*.[a-zA-Z.]*$", str);
    }

    // ???????????? ????????? ??????

    public static String isValidPassword(String password) {
        // ?????? 8??? ?????? ??????
        final int MIN = 8;

        // ??????, ??????, ???????????? ????????? MIN to MAX ?????? ?????????
        final String REGEX =
                "^((?=.*\\d)(?=.*[a-zA-Z])(?=.*[\\W]).{" + MIN + "," + "})$";
        // ?????? ?????? ?????????
        final String BLANKPT = "(\\s)";

        // ????????? ????????????
        Matcher matcher;

        // ?????? ??????
        if (password == null || "".equals(password)) {
            return "Detected: No Password";
        }

        // ASCII ?????? ????????? ?????? UpperCase
        String tmpPw = password.toUpperCase();
        // ????????? ??????
        int strLen = tmpPw.length();

        // ?????? ?????? ??????
        if (strLen < 8) {
            return "Detected: Incorrect Length(Length: " + strLen + ")";
        }

        // ?????? ??????
        matcher = Pattern.compile(BLANKPT).matcher(tmpPw);
        if (matcher.find()) {
            return "Detected: Blank";
        }

        // ???????????? ????????? ??????
        matcher = Pattern.compile(REGEX).matcher(tmpPw);
        if (!matcher.find()) {
            return "Detected: Wrong Regex";
        }
        return "";
    }

    // ???????????????/????????????
    public Boolean addCancelFollow(String followingNickname, String followerEmail) {
        Member following = memberRepository.findByNickname(followingNickname).orElseThrow();
        Member follower = memberRepository.findByEmail(followerEmail).orElseThrow();
        Notice notice = noticeRepository.findByToMemberAndFromMemberAndType(following, follower, 1).orElse(null);

        if (follower.getMemberId() == following.getMemberId()) {
            return Boolean.FALSE;
        }

        Follow follow = followRepository.findByFollowerAndFollowing(follower, following).orElse(null);

        if (follow == null) {
            Follow followBuild = Follow.builder()
                    .follower(follower)
                    .following(following)
                    .build();
            followRepository.save(followBuild);

            Notice noticeBuild = Notice.builder()
                    .toMember(following)
                    .fromMember(follower)
                    .type(1)
                    .board(null)
                    .comment(null)
                    .createdDateTime(LocalDateTime.now())
                    .build();
            noticeRepository.save(noticeBuild);

            // ?????? ?????? ?????????
            try {
                if (following.getFcmToken() != null) {
                    Notification notification = new Notification("",
                            follower.getNickname() + "?????? ???????????? ?????????????????????.");

                    Message message = Message.builder()
                            .setNotification(notification)
                            .setToken(following.getFcmToken())
                            .build();

                    FirebaseMessaging.getInstance().send(message);
                }
            } catch (Exception e){
                following.setFcmToken(null);
                memberRepository.save(following);
            }



            return Boolean.TRUE;
        } else {
            noticeRepository.delete(notice);
            followRepository.delete(follow);
            return Boolean.FALSE;
        }
    }

    // ????????? ????????? ?????? ??????
    public FollowMemberList listFollow(String nickname, String email) {
        Member member = memberRepository.findByNickname(nickname).orElseThrow();
        Member user = memberRepository.findByEmail(email).orElseThrow();
        FollowMemberList followMemberList = new FollowMemberList();

        List<FollowMemberDto> followings = new ArrayList<>();
        List<FollowMemberDto> followers = new ArrayList<>();

        List<Follow> followingMembers = followRepository.findAllByFollower(member);
        List<Follow> followerMembers = followRepository.findAllByFollowing(member);

        for (Follow following : followingMembers) {
            Member followingMember = following.getFollowing();
            MemberRankExp memberRankExp = memberRankExpRepository.findByMember(followingMember).orElseThrow();
            if (user.getMemberId() == followingMember.getMemberId()) continue;

            FollowMemberDto myFollowing = new FollowMemberDto();

            myFollowing.setNickname(followingMember.getNickname());
            myFollowing.setGender(followingMember.getGender());
            myFollowing.setImage(followingMember.getMemberProfileImg());
            myFollowing.setHeight(followingMember.getHeight());
            myFollowing.setWingspan(followingMember.getWingspan());
            myFollowing.setShoeSize(followingMember.getShoeSize());
            myFollowing.setRank(memberRankExp.getRank().getName());
            myFollowing.setFollow(followRepository.existsByFollowerMemberIdAndFollowingMemberId(user.getMemberId(), followingMember.getMemberId()));

            followings.add(myFollowing);
        }

        for (Follow follower : followerMembers) {
            Member followerMember = follower.getFollower();
            MemberRankExp memberRankExp = memberRankExpRepository.findByMember(followerMember).orElseThrow();

            if (user.getMemberId() == followerMember.getMemberId()) continue;

            FollowMemberDto myFollower = new FollowMemberDto();
            myFollower.setNickname(followerMember.getNickname());
            myFollower.setGender(followerMember.getGender());
            myFollower.setImage(followerMember.getMemberProfileImg());
            myFollower.setHeight(followerMember.getHeight());
            myFollower.setWingspan(followerMember.getWingspan());
            myFollower.setShoeSize(followerMember.getShoeSize());
            myFollower.setRank(memberRankExp.getRank().getName());
            myFollower.setFollow(followRepository.existsByFollowerMemberIdAndFollowingMemberId(user.getMemberId(), followerMember.getMemberId()));

            followers.add(myFollower);
        }


        followers.sort(new Comparator<FollowMemberDto>() {
            @Override
            public int compare(FollowMemberDto o1, FollowMemberDto o2) {
                Integer a = (o1.getFollow()) ? 1 : 0;
                Integer b = (o2.getFollow()) ? 1 : 0;
                return (b - a);
            }
        });

        followings.sort(new Comparator<FollowMemberDto>() {
            @Override
            public int compare(FollowMemberDto o1, FollowMemberDto o2) {
                Integer a = (o1.getFollow()) ? 1 : 0;
                Integer b = (o2.getFollow()) ? 1 : 0;
                return (b - a);
            }
        });

        if (followRepository.existsByFollowerMemberIdAndFollowingMemberId(user.getMemberId(), member.getMemberId())) {
            MemberRankExp memberRankExp = memberRankExpRepository.findByMember(user).orElseThrow();
            FollowMemberDto myFollowing = new FollowMemberDto();

            myFollowing.setNickname(user.getNickname());
            myFollowing.setGender(user.getGender());
            myFollowing.setImage(user.getMemberProfileImg());
            myFollowing.setHeight(user.getHeight());
            myFollowing.setWingspan(user.getWingspan());
            myFollowing.setShoeSize(user.getShoeSize());
            myFollowing.setRank(memberRankExp.getRank().getName());
            myFollowing.setFollow(false);

            followers.add(0, myFollowing);
        }

        if (followRepository.existsByFollowerMemberIdAndFollowingMemberId(member.getMemberId(), user.getMemberId())) {
            MemberRankExp memberRankExp = memberRankExpRepository.findByMember(user).orElseThrow();
            FollowMemberDto myFollowing = new FollowMemberDto();

            myFollowing.setNickname(user.getNickname());
            myFollowing.setGender(user.getGender());
            myFollowing.setImage(user.getMemberProfileImg());
            myFollowing.setHeight(user.getHeight());
            myFollowing.setWingspan(user.getWingspan());
            myFollowing.setShoeSize(user.getShoeSize());
            myFollowing.setRank(memberRankExp.getRank().getName());
            myFollowing.setFollow(false);

            followings.add(0, myFollowing);
        }

        followMemberList.setFollowers(followers);
        followMemberList.setFollowings(followings);
        followMemberList.setFollowerNum(followers.size());
        followMemberList.setFollowingNum(followings.size());

        return followMemberList;
    }

    // ?????? ?????? ??????
    public List<NoticeDto> readNotice(String email) {
        Member member = memberRepository.findByEmail(email).orElseThrow();
        List<Notice> noticeList = noticeRepository.findAllByToMember(member, Sort.by(Sort.Direction.DESC, "createdDateTime"));
        List<NoticeDto> noticeDtos = new ArrayList<>();

        for (Notice notice : noticeList) {
            NoticeDto noticeDto = new NoticeDto();
            LocalDateTime createdTime = notice.getCreatedDateTime();

            String timeText = createdTime.getYear() + "??? " + createdTime.getMonth().getValue() + "??? " + createdTime.getDayOfMonth() + "???";
            Long minus = ChronoUnit.MINUTES.between(createdTime, LocalDateTime.now());
            if (minus <= 10) {
                timeText = "?????? ???";
            } else if (minus <= 60) {
                timeText = minus + "??? ???";
            } else if (minus <= 1440) {
                timeText = ChronoUnit.HOURS.between(createdTime, LocalDateTime.now()) + "?????? ???";
            } else if (ChronoUnit.YEARS.between(createdTime, LocalDateTime.now()) > 1) {
                timeText = createdTime.getMonth().getValue() + "??? " + createdTime.getDayOfMonth() + "???";
            }

            if (notice.getType() == 1) {
                noticeDto.setBoardId(null);
                noticeDto.setCommentId(null);
            } else if (notice.getType() == 4) {
                noticeDto.setBoardId(null);
                noticeDto.setCommentId(notice.getComment().getId());
            } else {
                noticeDto.setBoardId(notice.getBoard().getBoardId());
                noticeDto.setCommentId(null);
            }

            noticeDto.setProfileImage(notice.getFromMember().getMemberProfileImg());
            noticeDto.setNickname(notice.getFromMember().getNickname());
            noticeDto.setType(notice.getType());
            noticeDto.setCreatedAt(timeText);

            noticeDtos.add(noticeDto);
        }

        return noticeDtos;
    }

    // ????????? ??????
    @Override
    public String saveImage(MultipartFile file) {
        if (file != null) {
            String fileName = createFileName(file.getOriginalFilename());
            ObjectMetadata objectMetadata = new ObjectMetadata();
            objectMetadata.setContentLength(file.getSize());
            objectMetadata.setContentType(file.getContentType());
            try (InputStream inputStream = file.getInputStream()) {
                amazonS3.putObject(new PutObjectRequest(bucket + "/userProfile", fileName, inputStream, objectMetadata).withCannedAcl(CannedAccessControlList.PublicRead));
            } catch (IOException e) {
                throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "?????? ???????????? ??????????????????.");
            }
            return amazonS3.getUrl(bucket + "/userProfile", fileName).toString();
        } else {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "????????? ????????????.");
        }

    }

}
