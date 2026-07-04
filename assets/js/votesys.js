// ===== VOTING SYSTEM =====
document.addEventListener("DOMContentLoaded", function() {
    // ===== CONFIG =====
    const SHEET_URL = "https://script.google.com/macros/s/AKfycbwXSa6JzuM41_pJbggTdA-McbF7i4u277DQCQolKMcxcciij0QXYCA2irV8cuPY3Xu_/exec";
    const ADMIN_PASSWORD = "parliament2026"; // ต้องตรงกับใน Apps Script
    
    // ===== STATE =====
    let currentMember = null;
    let isVerified = false;
    let hasAttended = false;
    let hasVoted = false;
    let isAdmin = false;
    
    // ===== DOM REFS =====
    const searchInput = document.getElementById('memberSearch');
    const searchBtn = document.getElementById('searchBtn');
    const searchResult = document.getElementById('searchResult');
    const barcodeStep = document.getElementById('barcodeStep');
    const barcodeImg = document.getElementById('barcodeImg');
    const barcodeInput = document.getElementById('barcodeInput');
    const verifyBtn = document.getElementById('verifyBtn');
    const verifyResult = document.getElementById('verifyResult');
    const voteButtons = document.getElementById('voteButtons');
    const voteResult = document.getElementById('voteResult');
    const adminPanel = document.getElementById('adminPanel');
    const resetBtn = document.getElementById('resetBtn');
    const resetPassword = document.getElementById('resetPassword');
    const resetResult = document.getElementById('resetResult');
    
    const voteAttend = document.getElementById('voteAttend');
    const voteAgree = document.getElementById('voteAgree');
    const voteDisagree = document.getElementById('voteDisagree');
    const voteAbstain = document.getElementById('voteAbstain');
    
    const attendCount = document.getElementById('attendCount');
    const totalVotes = document.getElementById('totalVotes');
    const agreeCount = document.getElementById('agreeCount');
    const disagreeCount = document.getElementById('disagreeCount');
    const abstainCount = document.getElementById('abstainCount');
    const notVoteCount = document.getElementById('notVoteCount');
    
    // ===== ฟังก์ชัน Skeleton =====
    function showSkeleton() {
        document.querySelectorAll('.skeleton-number').forEach(el => {
            el.classList.add('skeleton');
        });
        document.querySelectorAll('.skeleton-stat').forEach(el => {
            el.classList.add('skeleton');
        });
        searchInput.classList.add('skeleton');
        document.querySelectorAll('.vote-btn').forEach(el => {
            el.classList.add('skeleton');
        });
        document.querySelector('.barcode-image')?.classList.add('skeleton');
        searchResult.classList.add('skeleton');
    }
    
    function hideSkeleton() {
        document.querySelectorAll('.skeleton-number').forEach(el => {
            el.classList.remove('skeleton');
            el.classList.add('loaded');
        });
        document.querySelectorAll('.skeleton-stat').forEach(el => {
            el.classList.remove('skeleton');
            el.classList.add('loaded');
        });
        searchInput.classList.remove('skeleton');
        document.querySelectorAll('.vote-btn').forEach(el => {
            el.classList.remove('skeleton');
        });
        document.querySelector('.barcode-image')?.classList.remove('skeleton');
        searchResult.classList.remove('skeleton');
        searchResult.className = 'search-result';
    }
    
    // ===== ฟังก์ชันหลัก =====
    
    async function searchMember(name) {
        searchResult.className = 'search-result skeleton';
        searchResult.textContent = '⏳ กำลังค้นหา...';
        
        try {
            const response = await fetch(`${SHEET_URL}?action=getMember&name=${encodeURIComponent(name)}`);
            const data = await response.json();
            
            if (data.success && data.member) {
                currentMember = data.member;
                hasAttended = false;
                hasVoted = false;
                isVerified = false;
                
                // ✅ ตรวจสอบสิทธิ์ Admin
                await checkAdmin(currentMember.id);
                
                searchResult.className = 'search-result success';
                searchResult.innerHTML = `
                    ✅ พบผู้ลงคะแนน: <strong>${data.member.name}</strong><br>
                    <small>รหัส: ${data.member.id} | ${data.member.role}</small>
                    ${isAdmin ? ' <span style="color:#ff6600;font-weight:700;">🔑 Admin</span>' : ''}
                `;
                barcodeStep.style.display = 'block';
                loadBarcode(data.member.id);
                voteButtons.style.display = 'none';
                enableVoteButtons(false);
                voteResult.textContent = '';
                
                // ✅ แสดง Admin Panel ถ้ามีสิทธิ์
                if (isAdmin) {
                    adminPanel.style.display = 'block';
                } else {
                    adminPanel.style.display = 'none';
                }
            } else {
                searchResult.className = 'search-result error';
                searchResult.textContent = '❌ ไม่พบชื่อผู้ลงคะแนน';
                barcodeStep.style.display = 'none';
                voteButtons.style.display = 'none';
                adminPanel.style.display = 'none';
                currentMember = null;
                isAdmin = false;
            }
        } catch (error) {
            console.error('Search error:', error);
            searchResult.className = 'search-result error';
            searchResult.textContent = '❌ เกิดข้อผิดพลาดในการค้นหา';
        }
    }
    
    // ✅ ตรวจสอบสิทธิ์ Admin
    async function checkAdmin(memberId) {
        try {
            const response = await fetch(`${SHEET_URL}?action=checkAdmin&memberId=${memberId}`);
            const data = await response.json();
            
            if (data.success) {
                isAdmin = data.isAdmin;
            } else {
                isAdmin = false;
            }
        } catch (error) {
            console.error('Check admin error:', error);
            isAdmin = false;
        }
    }
    
    async function loadBarcode(memberId) {
        try {
            const response = await fetch(`${SHEET_URL}?action=getBarcode&id=${memberId}`);
            const data = await response.json();
            
            if (data.success && data.barcode) {
                barcodeImg.src = data.barcode.imageUrl;
            } else {
                barcodeImg.src = '';
            }
        } catch (error) {
            console.error('Barcode error:', error);
        }
    }
    
    async function verifyBarcode(code) {
        if (!currentMember) {
            verifyResult.className = 'verify-result error';
            verifyResult.textContent = '❌ กรุณาค้นหาชื่อก่อน';
            return;
        }
        
        verifyResult.className = 'verify-result skeleton';
        verifyResult.textContent = '⏳ กำลังยืนยัน...';
        
        try {
            const response = await fetch(`${SHEET_URL}?action=verifyBarcode&id=${currentMember.id}&code=${code}`);
            const data = await response.json();
            
            if (data.success && data.verified) {
                isVerified = true;
                verifyResult.className = 'verify-result success';
                verifyResult.innerHTML = '✅ ยืนยันตัวตนสำเร็จ! <br><small>กรุณากด "แสดงตน"</small>';
                voteButtons.style.display = 'block';
                voteAttend.disabled = false;
                voteAgree.disabled = true;
                voteDisagree.disabled = true;
                voteAbstain.disabled = true;
                voteResult.textContent = '';
            } else {
                verifyResult.className = 'verify-result error';
                verifyResult.textContent = '❌ รหัสบาร์โค้ดไม่ถูกต้อง';
                isVerified = false;
            }
        } catch (error) {
            console.error('Verify error:', error);
            verifyResult.className = 'verify-result error';
            verifyResult.textContent = '❌ เกิดข้อผิดพลาดในการยืนยัน';
        }
    }
    
    async function handleAttend() {
        if (!isVerified || !currentMember) {
            voteResult.className = 'vote-result error';
            voteResult.textContent = '❌ กรุณายืนยันตัวตนก่อน';
            return;
        }
        
        if (hasAttended) {
            voteResult.className = 'vote-result error';
            voteResult.textContent = '⚠️ คุณได้แสดงตนแล้ว';
            return;
        }
        
        voteResult.className = 'vote-result skeleton';
        voteResult.textContent = '⏳ กำลังบันทึก...';
        
        try {
            const url = `${SHEET_URL}?action=attend&memberId=${encodeURIComponent(currentMember.id)}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                hasAttended = true;
                voteResult.className = 'vote-result success';
                voteResult.innerHTML = '✅ แสดงตนสำเร็จ! <br><small>กรุณาลงคะแนนเสียง</small>';
                voteAttend.disabled = true;
                voteAgree.disabled = false;
                voteDisagree.disabled = false;
                voteAbstain.disabled = false;
                updateStats();
            } else {
                voteResult.className = 'vote-result error';
                voteResult.textContent = `❌ ${data.message}`;
            }
        } catch (error) {
            console.error('Attend error:', error);
            voteResult.className = 'vote-result error';
            voteResult.textContent = '❌ เกิดข้อผิดพลาดในการแสดงตน';
        }
    }
    
    async function submitVote(voteType) {
        if (!isVerified || !currentMember) {
            voteResult.className = 'vote-result error';
            voteResult.textContent = '❌ กรุณายืนยันตัวตนก่อน';
            return;
        }
        
        if (!hasAttended) {
            voteResult.className = 'vote-result error';
            voteResult.textContent = '❌ กรุณาแสดงตนก่อนลงคะแนน';
            return;
        }
        
        if (hasVoted) {
            voteResult.className = 'vote-result error';
            voteResult.textContent = '⚠️ คุณได้ลงคะแนนไปแล้ว';
            return;
        }
        
        voteResult.className = 'vote-result skeleton';
        voteResult.textContent = '⏳ กำลังบันทึกคะแนน...';
        
        try {
            const url = `${SHEET_URL}?action=submitVote&memberId=${encodeURIComponent(currentMember.id)}&vote=${encodeURIComponent(voteType)}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                hasVoted = true;
                voteResult.className = 'vote-result success';
                voteResult.innerHTML = `✅ ลงคะแนน ${getVoteLabel(voteType)} สำเร็จ! <br><small>ขอบคุณที่ใช้สิทธิ์</small>`;
                enableVoteButtons(false);
                updateStats();
            } else {
                voteResult.className = 'vote-result error';
                voteResult.textContent = `❌ ${data.message}`;
            }
        } catch (error) {
            console.error('Vote error:', error);
            voteResult.className = 'vote-result error';
            voteResult.textContent = '❌ เกิดข้อผิดพลาดในการลงคะแนน';
        }
    }
    
    // ✅ รีเซ็ตการลงคะแนน
    async function handleReset() {
        const password = resetPassword.value.trim();
        if (!password) {
            resetResult.className = 'reset-result error';
            resetResult.textContent = '❌ กรุณากรอกรหัสผ่าน';
            return;
        }
        
        if (!currentMember) {
            resetResult.className = 'reset-result error';
            resetResult.textContent = '❌ กรุณาค้นหาชื่อก่อน';
            return;
        }
        
        if (!isAdmin) {
            resetResult.className = 'reset-result error';
            resetResult.textContent = '❌ คุณไม่มีสิทธิ์รีเซ็ต';
            return;
        }
        
        if (!confirm('⚠️ ยืนยันรีเซ็ตการลงคะแนนทั้งหมด?')) {
            return;
        }
        
        resetResult.className = 'reset-result skeleton';
        resetResult.textContent = '⏳ กำลังรีเซ็ต...';
        
        try {
            const url = `${SHEET_URL}?action=resetVotes&memberId=${encodeURIComponent(currentMember.id)}&password=${encodeURIComponent(password)}`;
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.success) {
                resetResult.className = 'reset-result success';
                resetResult.innerHTML = `✅ ${data.message}`;
                resetPassword.value = '';
                updateStats();
            } else {
                resetResult.className = 'reset-result error';
                resetResult.textContent = `❌ ${data.message}`;
            }
        } catch (error) {
            console.error('Reset error:', error);
            resetResult.className = 'reset-result error';
            resetResult.textContent = '❌ เกิดข้อผิดพลาดในการรีเซ็ต';
        }
    }
    
    function getVoteLabel(type) {
        const labels = {
            'attend': 'แสดงตน',
            'agree': 'เห็นด้วย',
            'disagree': 'ไม่เห็นด้วย',
            'abstain': 'งดออกเสียง'
        };
        return labels[type] || type;
    }
    
    function enableVoteButtons(enabled) {
        const btns = [voteAttend, voteAgree, voteDisagree, voteAbstain];
        btns.forEach(btn => btn.disabled = !enabled);
    }
    
    async function updateStats() {
        try {
            const response = await fetch(`${SHEET_URL}?action=getStats`);
            const data = await response.json();
            
            if (data.success) {
                const stats = data.stats;
                attendCount.textContent = stats.attend || 0;
                totalVotes.textContent = stats.totalVotes || 0;
                agreeCount.textContent = stats.agree || 0;
                disagreeCount.textContent = stats.disagree || 0;
                abstainCount.textContent = stats.abstain || 0;
                notVoteCount.textContent = stats.notVote || 0;
                hideSkeleton();
            }
        } catch (error) {
            console.error('Stats error:', error);
            hideSkeleton();
        }
    }
    
    // ===== Event Listeners =====
    searchBtn.addEventListener('click', () => {
        const name = searchInput.value.trim();
        if (name) searchMember(name);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBtn.click();
    });
    
    verifyBtn.addEventListener('click', () => {
        const code = barcodeInput.value.trim();
        if (code) verifyBarcode(code);
    });
    
    barcodeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') verifyBtn.click();
    });
    
    voteAttend.addEventListener('click', handleAttend);
    voteAgree.addEventListener('click', () => submitVote('agree'));
    voteDisagree.addEventListener('click', () => submitVote('disagree'));
    voteAbstain.addEventListener('click', () => submitVote('abstain'));
    
    // ✅ ปุ่มรีเซ็ต
    resetBtn.addEventListener('click', handleReset);
    resetPassword.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleReset();
    });
    
    // ===== โหลดเริ่มต้น =====
    showSkeleton();
    updateStats();
    setInterval(updateStats, 10000);
});
